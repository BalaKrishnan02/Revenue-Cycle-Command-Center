package com.xirotech.rcm.service;

import com.xirotech.rcm.model.Alert;
import com.xirotech.rcm.model.Claim;
import com.xirotech.rcm.model.ClaimHistory;
import com.xirotech.rcm.model.Payment;
import com.xirotech.rcm.repository.AlertRepository;
import com.xirotech.rcm.repository.ClaimHistoryRepository;
import com.xirotech.rcm.repository.ClaimRepository;
import com.xirotech.rcm.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ClaimRepository claimRepository;
    private final PaymentRepository paymentRepository;
    private final AlertRepository alertRepository;
    private final ClaimHistoryRepository claimHistoryRepository;
    private final BillingPriorityService billingPriorityService;

    @Override
    public void run(String... args) {
        // If CLM3001 already exists, don't re-seed
        if (claimRepository.findByClaimId("CLM3001").isPresent()) {
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

        // Save & calculate priority for all
        for (Claim c : seedClaims) {
            billingPriorityService.calculateBillingPriority(c);
        }
        claimRepository.saveAll(seedClaims);

        // Seed initial payments
        seedPayments(seedClaims);

        // Seed Alerts
        seedAlerts();

        log.info("Seeded {} claims with Smart Billing Priority attributes.", seedClaims.size());
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

        return Claim.builder()
                .claimId(claimId)
                .patientName(patient)
                .patientReference(ref)
                .payerName(payer)
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
}
