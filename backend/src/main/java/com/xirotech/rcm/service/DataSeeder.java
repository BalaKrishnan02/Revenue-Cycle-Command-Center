package com.xirotech.rcm.service;

import com.xirotech.rcm.model.*;
import com.xirotech.rcm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ClaimRepository claimRepository;
    private final PaymentRepository paymentRepository;
    private final AlertRepository alertRepository;
    private final ClaimHistoryRepository claimHistoryRepository;
    private final InsuranceCompanyRepository insuranceCompanyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BillingPriorityService billingPriorityService;
    private final ArAgingService arAgingService;

    @Override
    public void run(String... args) {
        // 1. Seed Demo Insurance Companies
        seedInsuranceCompanies();

        // 2. Seed Demo User Accounts (BCrypt encoded)
        seedDemoUsers();

        // 3. Migrate existing claims/payments if missing company IDs
        migrateExistingClaimsAndPayments();

        // 4. Ensure all 5 insurance companies have realistic DENIED claims
        ensureAllPayersHaveDeniedClaims();

        // Seed AR Aging showcase claims if not present
        if (claimRepository.findFirstByClaimId("CLM6001").isEmpty()) {
            seedArAgingClaims();
        }

        // If CLM3001 already exists, don't re-seed base priority claims
        if (claimRepository.findFirstByClaimId("CLM3001").isPresent()) {
            log.info("Database already seeded with demo priority claims.");
            return;
        }

        log.info("Seeding realistic RCM claims with Smart Billing Priority Queue metrics...");

        List<Claim> seedClaims = new ArrayList<>();

        // Priority Queue Demo Showcase Claims:
        // 1. CLM3001: ₹1,20,000 total, ₹20,000 paid, ₹1,00,000 pending, 20 days -> CRITICAL
        seedClaims.add(buildPriorityClaim("CLM3001", "Vikramaditya Singhania", "PT3001", "Nova Health Insurance", "PRIVATE",
                120000, 20000, 20, "SUBMITTED", "PARTIALLY_PAID",
                true, true, true, true, 0,
                16, "LOW", "Clean Claim Quality Metrics", "Ready for payment follow-up.", null));

        // 2. CLM3002: ₹25,000 total, ₹0 paid, ₹25,000 pending, 12 days -> MEDIUM
        seedClaims.add(buildPriorityClaim("CLM3002", "Ananya Deshmukh", "PT3002", "CareShield", "COMMERCIAL",
                25000, 0, 12, "PENDING", "UNPAID",
                true, true, true, true, 0,
                19, "LOW", "Clean Claim Quality Metrics", "Under standard payer adjudication.", null));

        // 3. CLM3003: ₹90,000 total, ₹20,000 paid, ₹70,000 pending, 32 days -> CRITICAL
        seedClaims.add(buildPriorityClaim("CLM3003", "Harishchand Murthy", "PT3003", "MediSecure", "PRIVATE",
                90000, 20000, 32, "PENDING", "PARTIALLY_PAID",
                true, true, true, true, 1,
                24, "LOW", "Clean Claim Quality Metrics", "High-value balance overdue > 30 days.", null));

        // Additional High & Medium Priority Claims:
        seedClaims.add(buildPriorityClaim("CLM2060", "Rohan Malhotra", "PT2060", "HealthPrime", "COMMERCIAL",
                85000, 0, 18, "SUBMITTED", "UNPAID",
                true, true, true, true, 0,
                21, "LOW", "Clean Claim Quality Metrics", "Awaiting initial remittance.", null));

        seedClaims.add(buildPriorityClaim("CLM2065", "Meenakshi Sundaram", "PT2065", "Unity Payer Network", "PRIVATE",
                60000, 15000, 10, "PENDING", "PARTIALLY_PAID",
                true, true, true, true, 0,
                18, "LOW", "Clean Claim Quality Metrics", "Partial remittance received.", null));

        seedClaims.add(buildPriorityClaim("CLM2070", "Deepak Chopra", "PT2070", "CareShield", "COMMERCIAL",
                45000, 0, 5, "AI_CHECKED", "UNPAID",
                true, true, true, true, 0,
                15, "LOW", "Clean Claim Quality Metrics", "Recently generated bill.", null));

        // Existing High Risk & Denied Examples:
        seedClaims.add(buildPriorityClaim("CLM1001", "Arun Kumar", "PT1001", "Nova Health Insurance", "PRIVATE",
                35000, 0, 14, "DENIED", "UNPAID",
                false, true, true, true, 2,
                84, "HIGH", "Insurance Eligibility Not Verified", "Verify active eligibility.",
                "Eligibility Issue: Coverage expired on 2026-08-15"));

        seedClaims.add(buildPriorityClaim("CLM1002", "Priya Sharma", "PT1002", "CareShield", "COMMERCIAL",
                48000, 0, 8, "HIGH_RISK", "UNPAID",
                true, false, true, true, 3,
                88, "HIGH", "Missing Prior Authorization", "Obtain required authorization.", null));

        seedClaims.add(buildPriorityClaim("CLM1003", "Rahul Verma", "PT1003", "MediSecure", "PRIVATE",
                62000, 0, 22, "DENIED", "UNPAID",
                true, true, false, false, 1,
                76, "HIGH", "Incomplete / Invalid Coding (ICD/CPT)", "Review diagnosis coding.",
                "Coding Error: CPT 99214 requires modifier -25"));

        // Fully Paid Claims (Will not appear in Priority Queue):
        seedClaims.add(buildPriorityClaim("CLM1006", "Ananya Sen", "PT1006", "Nova Health Insurance", "PRIVATE",
                25000, 25000, 1, "PAID", "PAID",
                true, true, true, true, 0,
                14, "LOW", "Clean Claim Quality Metrics", "Claim settled.", null));

        seedClaims.add(buildPriorityClaim("CLM1007", "Karthik Iyer", "PT1007", "CareShield", "COMMERCIAL",
                54000, 54000, 2, "PAID", "PAID",
                true, true, true, true, 0,
                18, "LOW", "Clean Claim Quality Metrics", "Claim settled.", null));

        seedClaims.add(buildPriorityClaim("CLM1010", "Sunita Rao", "PT1010", "Unity Payer Network", "PRIVATE",
                90000, 90000, 3, "PAID", "PAID",
                true, true, true, true, 0,
                16, "LOW", "Clean Claim Quality Metrics", "Claim settled.", null));

        // Save & calculate priority and AR Aging for all
        for (Claim c : seedClaims) {
            billingPriorityService.calculateBillingPriority(c);
            arAgingService.calculateArAging(c);
        }
        claimRepository.saveAll(seedClaims);

        // Seed initial payments
        seedPayments(seedClaims);

        // Seed Alerts
        seedAlerts();

        log.info("Seeded {} claims with Smart Billing Priority attributes.", seedClaims.size());
    }

    private void seedArAgingClaims() {
        log.info("Seeding dedicated AR Aging showcase claims (CLM6001 - CLM6004)...");
        List<Claim> arClaims = new ArrayList<>();

        // 1. CLM6001: 0-30 Days (MONITOR)
        arClaims.add(buildPriorityClaim("CLM6001", "Kavita Ramachandran", "PT6001", "Nova Health Insurance", "PRIVATE",
                100000, 20000, 20, "SUBMITTED", "PARTIALLY_PAID",
                true, true, true, true, 0,
                15, "LOW", "Clean Claim Quality Metrics", "Within standard 30-day payment cycle.", null));

        // 2. CLM6002: 31-60 Days (FOLLOW_UP)
        arClaims.add(buildPriorityClaim("CLM6002", "Siddharth Venkat", "PT6002", "CareShield", "COMMERCIAL",
                90000, 10000, 45, "PENDING", "PARTIALLY_PAID",
                true, true, true, true, 0,
                18, "LOW", "Clean Claim Quality Metrics", "First follow-up call placed to CareShield.", null));

        // 3. CLM6003: 61-90 Days (HIGH_ATTENTION)
        arClaims.add(buildPriorityClaim("CLM6003", "Meera Krishnan", "PT6003", "MediSecure", "PRIVATE",
                120000, 20000, 75, "PENDING", "PARTIALLY_PAID",
                true, true, true, true, 1,
                22, "LOW", "Clean Claim Quality Metrics", "High-value balance overdue > 60 days. Escalation warning sent.", null));

        // 4. CLM6004: 90+ Days (CRITICAL)
        arClaims.add(buildPriorityClaim("CLM6004", "Rajeshwari Natarajan", "PT6004", "HealthPrime", "COMMERCIAL",
                150000, 30000, 110, "PENDING", "PARTIALLY_PAID",
                true, true, true, true, 2,
                26, "LOW", "Clean Claim Quality Metrics", "Critical overdue: 110 days pending. Payer liaison contact required.", null));

        for (Claim c : arClaims) {
            billingPriorityService.calculateBillingPriority(c);
            arAgingService.calculateArAging(c);
        }

        claimRepository.saveAll(arClaims);
        seedPayments(arClaims);
        log.info("Seeded 4 AR Aging claims: CLM6001, CLM6002, CLM6003, CLM6004.");
    }

    private Claim buildPriorityClaim(String claimId, String patient, String ref, String payer, String type,
                                    double totalBill, double paid, int daysPending,
                                    String status, String payStatus,
                                    boolean elig, boolean auth, boolean code, boolean doc, int prevDenials,
                                    int risk, String riskLevel, String reason, String rec, String denialReason) {
        List<String> reasons = new ArrayList<>();
        List<String> recs = new ArrayList<>();
        if (reason != null) reasons.add(reason);
        if (rec != null) recs.add(rec);

        String companyId = "INS001";
        String companyName = "Nova Health Insurance";
        if (payer != null) {
            String low = payer.toLowerCase();
            if (low.contains("nova")) { companyId = "INS001"; companyName = "Nova Health Insurance"; }
            else if (low.contains("care") || low.contains("shield")) { companyId = "INS002"; companyName = "CareShield Assurance"; }
            else if (low.contains("medi") || low.contains("secure")) { companyId = "INS003"; companyName = "MediSecure Benefits"; }
            else if (low.contains("prime") || low.contains("healthprime")) { companyId = "INS004"; companyName = "HealthPrime Plan"; }
            else if (low.contains("unity")) { companyId = "INS005"; companyName = "Unity Payer Network"; }
        }

        return Claim.builder()
                .claimId(claimId)
                .patientName(patient)
                .patientReference(ref)
                .insuranceCompanyId(companyId)
                .insuranceCompanyName(companyName)
                .payerName(companyName)
                .payerType(type)
                .claimAmount(totalBill)
                .totalBillAmount(totalBill)
                .paidAmount(paid)
                .pendingAmount(Math.max(0, totalBill - paid))
                .daysPending(daysPending)
                .eligibilityVerified(elig)
                .authorizationAvailable(auth)
                .codingComplete(code)
                .documentationComplete(doc)
                .previousDenials(prevDenials)
                .status(status)
                .paymentStatus(payStatus)
                .riskScore(risk)
                .riskLevel(riskLevel)
                .predictedReason(reason)
                .recommendation(rec)
                .detectedReasons(reasons)
                .recommendations(recs)
                .denialReason(denialReason)
                .createdAt(Instant.now().minus(daysPending, ChronoUnit.DAYS))
                .updatedAt(Instant.now())
                .build();
    }

    private void seedPayments(List<Claim> claims) {
        List<Payment> payments = new ArrayList<>();
        for (Claim c : claims) {
            if (c.getPaidAmount() > 0) {
                payments.add(Payment.builder()
                        .paymentId("PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .claimId(c.getClaimId())
                        .insuranceCompanyId(c.getInsuranceCompanyId())
                        .insuranceCompanyName(c.getInsuranceCompanyName())
                        .payerName(c.getPayerName())
                        .claimAmount(c.getTotalBillAmount())
                        .paidAmount(c.getPaidAmount())
                        .paymentStatus("PAID")
                        .transactionReference("TXN-" + (int)(Math.random() * 899999 + 100000))
                        .paymentDate(Instant.now().minus(1, ChronoUnit.DAYS))
                        .createdAt(Instant.now().minus(1, ChronoUnit.DAYS))
                        .build());
            }
        }
        paymentRepository.saveAll(payments);
    }

    private void seedInsuranceCompanies() {
        if (insuranceCompanyRepository.count() > 0) return;

        log.info("Seeding the 5 demo insurance companies...");
        List<InsuranceCompany> companies = List.of(
                InsuranceCompany.builder()
                        .id("INS001")
                        .companyCode("NOVA001")
                        .companyName("Nova Health Insurance")
                        .contactPerson("John Miller")
                        .email("nova@insurance.com")
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build(),
                InsuranceCompany.builder()
                        .id("INS002")
                        .companyCode("CARE002")
                        .companyName("CareShield Assurance")
                        .contactPerson("Sarah Jenkins")
                        .email("careshield@insurance.com")
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build(),
                InsuranceCompany.builder()
                        .id("INS003")
                        .companyCode("MEDI003")
                        .companyName("MediSecure Benefits")
                        .contactPerson("Robert Vance")
                        .email("medisecure@insurance.com")
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build(),
                InsuranceCompany.builder()
                        .id("INS004")
                        .companyCode("HP004")
                        .companyName("HealthPrime Plan")
                        .contactPerson("Priya Patel")
                        .email("healthprime@insurance.com")
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build(),
                InsuranceCompany.builder()
                        .id("INS005")
                        .companyCode("UNITY005")
                        .companyName("Unity Payer Network")
                        .contactPerson("David Chen")
                        .email("unity@insurance.com")
                        .status("ACTIVE")
                        .createdAt(Instant.now())
                        .build()
        );
        insuranceCompanyRepository.saveAll(companies);
        log.info("Seeded 5 demo insurance companies successfully.");
    }

    private void seedDemoUsers() {
        if (userRepository.count() > 0) return;

        log.info("Seeding demo users with BCrypt-hashed credentials...");
        List<User> demoUsers = List.of(
                // 1. RCM Administrator accounts
                User.builder()
                        .email("admin@rcminsight.demo")
                        .fullName("RCM Administrator")
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .role("RCM_ADMIN")
                        .organizationName("National Revenue Cycle Management")
                        .accountStatus("ACTIVE")
                        .active(true)
                        .createdAt(Instant.now())
                        .build(),
                User.builder()
                        .email("admin@rcminsight.com")
                        .fullName("RCM Administrator")
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .role("RCM_ADMIN")
                        .organizationName("National Revenue Cycle Management")
                        .accountStatus("ACTIVE")
                        .active(true)
                        .createdAt(Instant.now())
                        .build(),

                // 2. Demo Insurance Company users
                User.builder()
                        .email("nova@rcminsight.demo")
                        .fullName("Nova Insurance User")
                        .contactPerson("John Miller")
                        .passwordHash(passwordEncoder.encode("nova123"))
                        .role("INSURANCE_COMPANY")
                        .insuranceCompanyId("INS001")
                        .insuranceCompanyName("Nova Health Insurance")
                        .accountStatus("ACTIVE")
                        .active(true)
                        .createdAt(Instant.now())
                        .build(),
                User.builder()
                        .email("nova@insurance.com")
                        .fullName("John Miller")
                        .contactPerson("John Miller")
                        .passwordHash(passwordEncoder.encode("nova123"))
                        .role("INSURANCE_COMPANY")
                        .insuranceCompanyId("INS001")
                        .insuranceCompanyName("Nova Health Insurance")
                        .accountStatus("ACTIVE")
                        .active(true)
                        .createdAt(Instant.now())
                        .build(),
                User.builder()
                        .email("careshield@rcminsight.demo")
                        .fullName("CareShield Adjudicator")
                        .contactPerson("Sarah Jenkins")
                        .passwordHash(passwordEncoder.encode("careshield123"))
                        .role("INSURANCE_COMPANY")
                        .insuranceCompanyId("INS002")
                        .insuranceCompanyName("CareShield Assurance")
                        .accountStatus("ACTIVE")
                        .active(true)
                        .createdAt(Instant.now())
                        .build(),
                User.builder()
                        .email("medisecure@rcminsight.demo")
                        .fullName("MediSecure Claims Specialist")
                        .contactPerson("Robert Vance")
                        .passwordHash(passwordEncoder.encode("medisecure123"))
                        .role("INSURANCE_COMPANY")
                        .insuranceCompanyId("INS003")
                        .insuranceCompanyName("MediSecure Benefits")
                        .accountStatus("ACTIVE")
                        .active(true)
                        .createdAt(Instant.now())
                        .build(),
                User.builder()
                        .email("healthprime@rcminsight.demo")
                        .fullName("HealthPrime Reviewer")
                        .contactPerson("Priya Patel")
                        .passwordHash(passwordEncoder.encode("healthprime123"))
                        .role("INSURANCE_COMPANY")
                        .insuranceCompanyId("INS004")
                        .insuranceCompanyName("HealthPrime Plan")
                        .accountStatus("ACTIVE")
                        .active(true)
                        .createdAt(Instant.now())
                        .build(),
                User.builder()
                        .email("unity@rcminsight.demo")
                        .fullName("Unity Network User")
                        .contactPerson("David Chen")
                        .passwordHash(passwordEncoder.encode("unity123"))
                        .role("INSURANCE_COMPANY")
                        .insuranceCompanyId("INS005")
                        .insuranceCompanyName("Unity Payer Network")
                        .accountStatus("ACTIVE")
                        .active(true)
                        .createdAt(Instant.now())
                        .build()
        );

        userRepository.saveAll(demoUsers);
        log.info("Seeded demo users for RCM Admin and all 5 insurance companies.");
    }

    private void migrateExistingClaimsAndPayments() {
        List<Claim> claims = claimRepository.findAll();
        boolean claimsNeedSave = false;
        for (Claim c : claims) {
            String payer = ((c.getPayerName() != null ? c.getPayerName() : "") + " " + (c.getInsuranceCompanyName() != null ? c.getInsuranceCompanyName() : "")).toLowerCase();
            String canonicalId;
            String canonicalName;
            if (payer.contains("nova")) {
                canonicalId = "INS001";
                canonicalName = "Nova Health Insurance";
            } else if (payer.contains("care") || payer.contains("shield")) {
                canonicalId = "INS002";
                canonicalName = "CareShield Assurance";
            } else if (payer.contains("medi") || payer.contains("secure")) {
                canonicalId = "INS003";
                canonicalName = "MediSecure Benefits";
            } else if (payer.contains("prime") || payer.contains("healthprime")) {
                canonicalId = "INS004";
                canonicalName = "HealthPrime Plan";
            } else if (payer.contains("unity")) {
                canonicalId = "INS005";
                canonicalName = "Unity Payer Network";
            } else {
                canonicalId = "INS001";
                canonicalName = "Nova Health Insurance";
            }

            if (!canonicalId.equals(c.getInsuranceCompanyId()) || !canonicalName.equals(c.getInsuranceCompanyName()) || !canonicalName.equals(c.getPayerName())) {
                c.setInsuranceCompanyId(canonicalId);
                c.setInsuranceCompanyName(canonicalName);
                c.setPayerName(canonicalName);
                claimsNeedSave = true;
            }
        }
        if (claimsNeedSave) {
            claimRepository.saveAll(claims);
            log.info("Migrated and normalized existing claims with canonical insuranceCompanyId, insuranceCompanyName, and payerName.");
        }

        List<Payment> payments = paymentRepository.findAll();
        boolean paymentsNeedSave = false;
        for (Payment p : payments) {
            String payer = ((p.getPayerName() != null ? p.getPayerName() : "") + " " + (p.getInsuranceCompanyName() != null ? p.getInsuranceCompanyName() : "")).toLowerCase();
            String canonicalId;
            String canonicalName;
            if (payer.contains("nova")) {
                canonicalId = "INS001";
                canonicalName = "Nova Health Insurance";
            } else if (payer.contains("care") || payer.contains("shield")) {
                canonicalId = "INS002";
                canonicalName = "CareShield Assurance";
            } else if (payer.contains("medi") || payer.contains("secure")) {
                canonicalId = "INS003";
                canonicalName = "MediSecure Benefits";
            } else if (payer.contains("prime") || payer.contains("healthprime")) {
                canonicalId = "INS004";
                canonicalName = "HealthPrime Plan";
            } else if (payer.contains("unity")) {
                canonicalId = "INS005";
                canonicalName = "Unity Payer Network";
            } else {
                canonicalId = "INS001";
                canonicalName = "Nova Health Insurance";
            }

            if (!canonicalId.equals(p.getInsuranceCompanyId()) || !canonicalName.equals(p.getInsuranceCompanyName()) || !canonicalName.equals(p.getPayerName())) {
                p.setInsuranceCompanyId(canonicalId);
                p.setInsuranceCompanyName(canonicalName);
                p.setPayerName(canonicalName);
                paymentsNeedSave = true;
            }
        }
        if (paymentsNeedSave) {
            paymentRepository.saveAll(payments);
            log.info("Migrated and normalized existing payments with canonical insuranceCompanyId, insuranceCompanyName, and payerName.");
        }
    }

    private void seedInsuranceSpecificAlerts() {
        List<Alert> newAlerts = new ArrayList<>();

        if (alertRepository.findByInsuranceCompanyIdOrderByCreatedAtDesc("INS001").isEmpty()) {
            newAlerts.add(Alert.builder()
                    .alertId("ALT-NOVA-101")
                    .claimId("CLM1001")
                    .insuranceCompanyId("INS001")
                    .insuranceCompanyName("Nova Health Insurance")
                    .type("DENIAL")
                    .severity("CRITICAL")
                    .title("Eligibility Lapsed: CLM1001")
                    .message("Claim denied due to coverage expiration on 2026-08-15. Re-verification required with Nova Health.")
                    .resolved(false)
                    .createdAt(Instant.now().minus(2, ChronoUnit.HOURS))
                    .build());
            newAlerts.add(Alert.builder()
                    .alertId("ALT-NOVA-102")
                    .claimId("CLM3001")
                    .insuranceCompanyId("INS001")
                    .insuranceCompanyName("Nova Health Insurance")
                    .type("HIGH_PRIORITY")
                    .severity("CRITICAL")
                    .title("High Outstanding Balance: CLM3001")
                    .message("₹1,00,000 pending settlement for 20 days with Nova Health Insurance.")
                    .resolved(false)
                    .createdAt(Instant.now().minus(5, ChronoUnit.HOURS))
                    .build());
        }

        if (alertRepository.findByInsuranceCompanyIdOrderByCreatedAtDesc("INS002").isEmpty()) {
            newAlerts.add(Alert.builder()
                    .alertId("ALT-CARE-201")
                    .claimId("CLM1002")
                    .insuranceCompanyId("INS002")
                    .insuranceCompanyName("CareShield Assurance")
                    .type("DENIAL")
                    .severity("CRITICAL")
                    .title("Prior-Auth Documentation Missing: CLM1002")
                    .message("Claim denied for surgical procedure code 99214. Prior authorization approval letter required.")
                    .resolved(false)
                    .createdAt(Instant.now().minus(1, ChronoUnit.HOURS))
                    .build());
        }

        if (alertRepository.findByInsuranceCompanyIdOrderByCreatedAtDesc("INS003").isEmpty()) {
            newAlerts.add(Alert.builder()
                    .alertId("ALT-MEDI-301")
                    .claimId("CLM1003")
                    .insuranceCompanyId("INS003")
                    .insuranceCompanyName("MediSecure Benefits")
                    .type("DENIAL")
                    .severity("CRITICAL")
                    .title("Invalid Coding / CPT Modifier: CLM1003")
                    .message("Claim denied due to missing modifier -25 on consultation CPT 99214. Resubmission required.")
                    .resolved(false)
                    .createdAt(Instant.now().minus(3, ChronoUnit.HOURS))
                    .build());
        }

        if (alertRepository.findByInsuranceCompanyIdOrderByCreatedAtDesc("INS004").isEmpty()) {
            newAlerts.add(Alert.builder()
                    .alertId("ALT-HP-401")
                    .claimId("CLM4004")
                    .insuranceCompanyId("INS004")
                    .insuranceCompanyName("HealthPrime Plan")
                    .type("DENIAL")
                    .severity("CRITICAL")
                    .title("Filing Window Exceeded: CLM4004")
                    .message("Claim denied past 90-day adjudication limit with HealthPrime Plan. Formal appeal required.")
                    .resolved(false)
                    .createdAt(Instant.now().minus(4, ChronoUnit.HOURS))
                    .build());
        }

        if (alertRepository.findByInsuranceCompanyIdOrderByCreatedAtDesc("INS005").isEmpty()) {
            newAlerts.add(Alert.builder()
                    .alertId("ALT-UNITY-501")
                    .claimId("CLM4005")
                    .insuranceCompanyId("INS005")
                    .insuranceCompanyName("Unity Payer Network")
                    .type("DENIAL")
                    .severity("CRITICAL")
                    .title("Documentation Deficient: CLM4005")
                    .message("Claim denied by Unity Payer Network due to missing physician signature on operative notes.")
                    .resolved(false)
                    .createdAt(Instant.now().minus(6, ChronoUnit.HOURS))
                    .build());
        }

        if (!newAlerts.isEmpty()) {
            alertRepository.saveAll(newAlerts);
        }
    }

    private void seedAlerts() {
        if (alertRepository.count() > 0) return;
        List<Alert> alerts = List.of(
                Alert.builder()
                        .alertId("ALT-3001")
                        .claimId("CLM3001")
                        .type("HIGH_PRIORITY")
                        .severity("CRITICAL")
                        .title("High Outstanding Bill: CLM3001")
                        .message("₹1,00,000 outstanding for 20 days on claim CLM3001 with Nova Health Insurance. Immediate follow-up recommended.")
                        .resolved(false)
                        .createdAt(Instant.now().minus(2, ChronoUnit.HOURS))
                        .build(),
                Alert.builder()
                        .alertId("ALT-3003")
                        .claimId("CLM3003")
                        .type("OVERDUE")
                        .severity("CRITICAL")
                        .title("Overdue Payment: CLM3003")
                        .message("₹70,000 pending for 32 days with MediSecure. Exceeds standard 30-day settlement window.")
                        .resolved(false)
                        .createdAt(Instant.now().minus(4, ChronoUnit.HOURS))
                        .build()
        );
        alertRepository.saveAll(alerts);
    }

    private void ensureAllPayersHaveDeniedClaims() {
        // 1. CareShield Assurance (INS002): Ensure CLM1002 is marked DENIED
        Optional<Claim> careOpt = claimRepository.findFirstByClaimId("CLM1002");
        if (careOpt.isPresent()) {
            Claim c = careOpt.get();
            c.setStatus("DENIED");
            c.setInsuranceCompanyId("INS002");
            c.setInsuranceCompanyName("CareShield Assurance");
            c.setPayerName("CareShield Assurance");
            c.setDenialReason("Prior Authorization Absent: Pre-auth required for surgical procedure code 99214");
            claimRepository.save(c);
            log.info("Updated CLM1002 status to DENIED for CareShield Assurance.");
        }

        // 2. HealthPrime Plan (INS004): Ensure CLM1004 is marked DENIED
        Optional<Claim> hpOpt = claimRepository.findFirstByClaimId("CLM1004");
        if (hpOpt.isPresent()) {
            Claim c = hpOpt.get();
            c.setStatus("DENIED");
            c.setInsuranceCompanyId("INS004");
            c.setInsuranceCompanyName("HealthPrime Plan");
            c.setPayerName("HealthPrime Plan");
            c.setDenialReason("Eligibility Issue: Member coverage inactive on service date");
            claimRepository.save(c);
            log.info("Updated CLM1004 status to DENIED for HealthPrime Plan.");
        }

        // Seed CLM4004 for HealthPrime Plan if not present
        if (claimRepository.findFirstByClaimId("CLM4004").isEmpty()) {
            Claim cHp = buildPriorityClaim("CLM4004", "Manish Tiwari", "PT4004", "HealthPrime Plan", "COMMERCIAL",
                    68000, 0, 16, "DENIED", "UNPAID",
                    true, false, true, true, 2,
                    82, "HIGH", "Timely Filing Window Exceeded", "File formal appeal within 30 days.",
                    "Filing Limit Exceeded: Claim submitted past 90-day payer adjudication window.");
            cHp.setInsuranceCompanyId("INS004");
            cHp.setInsuranceCompanyName("HealthPrime Plan");
            billingPriorityService.calculateBillingPriority(cHp);
            arAgingService.calculateArAging(cHp);
            claimRepository.save(cHp);
            log.info("Seeded DENIED claim CLM4004 for HealthPrime Plan.");
        }

        // 3. Unity Payer Network (INS005): Ensure CLM1005 is marked DENIED
        Optional<Claim> unityOpt = claimRepository.findFirstByClaimId("CLM1005");
        if (unityOpt.isPresent()) {
            Claim c = unityOpt.get();
            c.setStatus("DENIED");
            c.setInsuranceCompanyId("INS005");
            c.setInsuranceCompanyName("Unity Payer Network");
            c.setPayerName("Unity Payer Network");
            c.setDenialReason("Documentation Deficient: Operative notes missing required physician signature");
            claimRepository.save(c);
            log.info("Updated CLM1005 status to DENIED for Unity Payer Network.");
        }

        // Seed CLM4005 for Unity Payer Network if not present
        if (claimRepository.findFirstByClaimId("CLM4005").isEmpty()) {
            Claim cUnity = buildPriorityClaim("CLM4005", "Tanvi Agarwal", "PT4005", "Unity Payer Network", "PRIVATE",
                    52000, 0, 19, "DENIED", "UNPAID",
                    true, true, false, false, 1,
                    79, "HIGH", "Incomplete Clinical Documentation", "Submit operative notes and pathology report.",
                    "Documentation Deficient: Operative notes missing required physician signature.");
            cUnity.setInsuranceCompanyId("INS005");
            cUnity.setInsuranceCompanyName("Unity Payer Network");
            billingPriorityService.calculateBillingPriority(cUnity);
            arAgingService.calculateArAging(cUnity);
            claimRepository.save(cUnity);
            log.info("Seeded DENIED claim CLM4005 for Unity Payer Network.");
        }
    }
}
