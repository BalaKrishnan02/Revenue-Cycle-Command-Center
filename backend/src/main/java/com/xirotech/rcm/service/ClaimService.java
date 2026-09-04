package com.xirotech.rcm.service;

import com.xirotech.rcm.dto.ClaimRequest;
import com.xirotech.rcm.dto.ClaimReviewRequest;
import com.xirotech.rcm.dto.PredictionRequest;
import com.xirotech.rcm.dto.PredictionResponse;
import com.xirotech.rcm.exception.ResourceNotFoundException;
import com.xirotech.rcm.model.Claim;
import com.xirotech.rcm.model.ClaimHistory;
import com.xirotech.rcm.model.InsuranceCompany;
import com.xirotech.rcm.repository.ClaimHistoryRepository;
import com.xirotech.rcm.repository.ClaimRepository;
import com.xirotech.rcm.repository.InsuranceCompanyRepository;
import com.xirotech.rcm.security.SecurityUtils;
import com.xirotech.rcm.security.UserPrincipal;
import com.xirotech.rcm.websocket.LiveUpdateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ClaimHistoryRepository claimHistoryRepository;
    private final InsuranceCompanyRepository insuranceCompanyRepository;
    private final MlClientService mlClientService;
    private final PayerSimulationService payerSimulationService;
    private final AlertService alertService;
    private final LiveUpdateService liveUpdateService;
    private final BillingPriorityService billingPriorityService;
    private final ArAgingService arAgingService;

    public List<Claim> getAllClaims() {
        UserPrincipal user = SecurityUtils.getCurrentUser();
        if (user != null && "INSURANCE_COMPANY".equalsIgnoreCase(user.getRole())) {
            String companyId = user.getCompanyId();
            log.info("Enforcing backend data isolation: fetching claims exclusively for companyId={}", companyId);
            return claimRepository.findByInsuranceCompanyIdOrderByCreatedAtDesc(companyId);
        }
        return claimRepository.findAllByOrderByCreatedAtDesc();
    }

    public Claim getClaimById(String idOrClaimId) {
        Claim claim = claimRepository.findByClaimId(idOrClaimId)
                .or(() -> claimRepository.findById(idOrClaimId))
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id or claimId: " + idOrClaimId));

        UserPrincipal user = SecurityUtils.getCurrentUser();
        if (user != null && "INSURANCE_COMPANY".equalsIgnoreCase(user.getRole())) {
            String companyId = user.getCompanyId();
            if (claim.getInsuranceCompanyId() != null && !claim.getInsuranceCompanyId().equalsIgnoreCase(companyId)) {
                log.warn("Security Alert: User {} belonging to {} attempted unauthorized access to claim {} belonging to company {}",
                        user.getEmail(), companyId, claim.getClaimId(), claim.getInsuranceCompanyId());
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Access Denied: You do not have permission to view claims belonging to another insurance company.");
            }
        }
        return claim;
    }

    public List<ClaimHistory> getClaimHistory(String claimId) {
        // Enforce same access check
        Claim claim = getClaimById(claimId);
        return claimHistoryRepository.findByClaimIdOrderByTimestampAsc(claim.getClaimId());
    }

    public Claim createClaim(ClaimRequest request) {
        String generatedClaimId = request.getClaimId() != null && !request.getClaimId().isBlank()
                ? request.getClaimId().trim().toUpperCase()
                : "CLM" + (1000 + (int) (claimRepository.count() + 1));

        String patientRef = request.getPatientReference() != null && !request.getPatientReference().isBlank()
                ? request.getPatientReference().trim()
                : "PT-" + generatedClaimId.replace("CLM", "");

        double billAmount = request.getClaimAmount() != null ? request.getClaimAmount() : 0.0;

        // Resolve insurance company
        Map<String, String> companyInfo = resolveInsuranceCompany(
                request.getInsuranceCompanyId(),
                request.getInsuranceCompanyName(),
                request.getPayerName()
        );
        String resolvedCompanyId = companyInfo.get("id");
        String resolvedCompanyName = companyInfo.get("name");

        Optional<Claim> existing = claimRepository.findByClaimId(generatedClaimId);
        Claim claim;
        if (existing.isPresent()) {
            claim = existing.get();
            claim.setPatientName(request.getPatientName());
            claim.setPatientReference(patientRef);
            claim.setInsuranceCompanyId(resolvedCompanyId);
            claim.setInsuranceCompanyName(resolvedCompanyName);
            claim.setPayerName(resolvedCompanyName);
            claim.setPayerType(request.getPayerType() != null ? request.getPayerType() : "COMMERCIAL");
            claim.setClaimAmount(billAmount);
            claim.setTotalBillAmount(billAmount);
            claim.setPaidAmount(0.0);
            claim.setPendingAmount(billAmount);
            claim.setEligibilityVerified(request.isEligibilityVerified());
            claim.setAuthorizationAvailable(request.isAuthorizationAvailable());
            claim.setCodingComplete(request.isCodingComplete());
            claim.setDocumentationComplete(request.isDocumentationComplete());
            claim.setPreviousDenials(request.getPreviousDenials());
            claim.setStatus("CREATED");
            claim.setPaymentStatus("UNPAID");
            claim.setDenialReason(null);
            claim.setDaysPending(claim.getDaysPending() > 0 ? claim.getDaysPending() : 1);
            claim.setUpdatedAt(Instant.now());
        } else {
            claim = Claim.builder()
                    .claimId(generatedClaimId)
                    .patientName(request.getPatientName())
                    .patientReference(patientRef)
                    .insuranceCompanyId(resolvedCompanyId)
                    .insuranceCompanyName(resolvedCompanyName)
                    .payerName(resolvedCompanyName)
                    .payerType(request.getPayerType() != null ? request.getPayerType() : "COMMERCIAL")
                    .claimAmount(billAmount)
                    .totalBillAmount(billAmount)
                    .paidAmount(0.0)
                    .pendingAmount(billAmount)
                    .daysPending(1)
                    .eligibilityVerified(request.isEligibilityVerified())
                    .authorizationAvailable(request.isAuthorizationAvailable())
                    .codingComplete(request.isCodingComplete())
                    .documentationComplete(request.isDocumentationComplete())
                    .previousDenials(request.getPreviousDenials())
                    .status("CREATED")
                    .paymentStatus("UNPAID")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
        }

        // Calculate billing priority score & reason and AR Aging
        billingPriorityService.calculateBillingPriority(claim);
        arAgingService.calculateArAging(claim);
        Claim saved = claimRepository.save(claim);

        logHistory(saved.getClaimId(), null, "CREATED", "Claim created in billing system for " + resolvedCompanyName + ". Bill Amount: ₹" + String.format("%,.0f", billAmount));
        liveUpdateService.broadcastUpdate("CLAIM_CREATED", saved);

        return saved;
    }

    private Map<String, String> resolveInsuranceCompany(String companyId, String companyName, String payerName) {
        if (companyId != null && !companyId.isBlank()) {
            Optional<InsuranceCompany> comp = insuranceCompanyRepository.findById(companyId)
                    .or(() -> insuranceCompanyRepository.findByCompanyCode(companyId));
            if (comp.isPresent()) {
                return Map.of("id", comp.get().getId(), "name", comp.get().getCompanyName());
            }
        }

        String candidate = (companyName != null && !companyName.isBlank()) ? companyName : payerName;
        if (candidate != null) {
            String lower = candidate.toLowerCase();
            if (lower.contains("nova")) return Map.of("id", "INS001", "name", "Nova Health Insurance");
            if (lower.contains("care") || lower.contains("shield")) return Map.of("id", "INS002", "name", "CareShield Assurance");
            if (lower.contains("medi") || lower.contains("secure")) return Map.of("id", "INS003", "name", "MediSecure Benefits");
            if (lower.contains("prime") || lower.contains("healthprime")) return Map.of("id", "INS004", "name", "HealthPrime Plan");
            if (lower.contains("unity")) return Map.of("id", "INS005", "name", "Unity Payer Network");
        }

        return Map.of("id", "INS001", "name", candidate != null ? candidate : "Nova Health Insurance");
    }

    public Claim predictClaimRisk(String idOrClaimId) {
        Claim claim = getClaimById(idOrClaimId);
        String oldStatus = claim.getStatus();

        PredictionRequest predReq = PredictionRequest.builder()
                .eligibilityVerified(claim.isEligibilityVerified())
                .authorizationAvailable(claim.isAuthorizationAvailable())
                .codingComplete(claim.isCodingComplete())
                .documentationComplete(claim.isDocumentationComplete())
                .claimAmount(claim.getClaimAmount())
                .previousDenials(claim.getPreviousDenials())
                .payerRiskScore(0.4)
                .build();

        PredictionResponse response = mlClientService.predictRisk(predReq);

        claim.setRiskScore(response.getRiskScore());
        claim.setRiskLevel(response.getRiskLevel());
        claim.setDetectedReasons(response.getReasons());
        claim.setRecommendations(response.getRecommendations());
        claim.setPredictedReason(!response.getReasons().isEmpty() ? response.getReasons().get(0) : "None");
        claim.setRecommendation(!response.getRecommendations().isEmpty() ? response.getRecommendations().get(0) : "Ready for submission.");

        String newStatus;
        if ("HIGH".equals(response.getRiskLevel())) {
            newStatus = "HIGH_RISK";
        } else if ("LOW".equals(response.getRiskLevel())) {
            newStatus = "READY_TO_SUBMIT";
        } else {
            newStatus = "AI_CHECKED";
        }

        claim.setStatus(newStatus);
        billingPriorityService.calculateBillingPriority(claim);
        claim.setUpdatedAt(Instant.now());
        Claim updated = claimRepository.save(claim);

        logHistory(claim.getClaimId(), oldStatus, newStatus,
                "AI Risk Check completed: " + response.getRiskScore() + "% (" + response.getRiskLevel() + " Risk). Root cause: " + claim.getPredictedReason());

        if ("HIGH".equals(response.getRiskLevel())) {
            alertService.createAlert(
                    claim.getClaimId(),
                    "HIGH_RISK",
                    "CRITICAL",
                    "High Denial Risk: " + claim.getClaimId(),
                    claim.getClaimId() + " has an estimated " + response.getRiskScore() + "% denial risk due to: " + claim.getPredictedReason()
            );
        } else if (!claim.isAuthorizationAvailable()) {
            alertService.createAlert(
                    claim.getClaimId(),
                    "MISSING_AUTH",
                    "WARNING",
                    "Missing Authorization: " + claim.getClaimId(),
                    "Authorization is missing for claim " + claim.getClaimId() + ". Please resolve prior to submission."
            );
        }

        liveUpdateService.broadcastUpdate("CLAIM_PREDICTED", updated);
        return updated;
    }

    public Claim updateOrCorrectClaim(String idOrClaimId, ClaimRequest request) {
        Claim claim = getClaimById(idOrClaimId);
        String oldStatus = claim.getStatus();

        if (request.getPatientName() != null) claim.setPatientName(request.getPatientName());
        if (request.getPayerName() != null) claim.setPayerName(request.getPayerName());
        if (request.getPayerType() != null) claim.setPayerType(request.getPayerType());
        if (request.getClaimAmount() != null && request.getClaimAmount() > 0) {
            claim.setClaimAmount(request.getClaimAmount());
            claim.setTotalBillAmount(request.getClaimAmount());
        }

        claim.setEligibilityVerified(request.isEligibilityVerified());
        claim.setAuthorizationAvailable(request.isAuthorizationAvailable());
        claim.setCodingComplete(request.isCodingComplete());
        claim.setDocumentationComplete(request.isDocumentationComplete());
        claim.setPreviousDenials(request.getPreviousDenials());

        String newStatus = ("DENIED".equals(oldStatus) || "HIGH_RISK".equals(oldStatus)) ? "CORRECTED" : oldStatus;
        claim.setStatus(newStatus);
        
        billingPriorityService.calculateBillingPriority(claim);
        arAgingService.calculateArAging(claim);
        claim.setUpdatedAt(Instant.now());

        Claim saved = claimRepository.save(claim);

        logHistory(claim.getClaimId(), oldStatus, newStatus,
                "Claim data corrected. Eligibility=" + (claim.isEligibilityVerified() ? "YES" : "NO") +
                ", Auth=" + (claim.isAuthorizationAvailable() ? "YES" : "NO") +
                ", Coding=" + (claim.isCodingComplete() ? "YES" : "NO") +
                ", Docs=" + (claim.isDocumentationComplete() ? "YES" : "NO"));

        liveUpdateService.broadcastUpdate("CLAIM_UPDATED", saved);
        return saved;
    }

    public Claim submitClaim(String idOrClaimId) {
        Claim claim = getClaimById(idOrClaimId);
        String oldStatus = claim.getStatus();

        claim.setStatus("SUBMITTED");
        if (claim.getClaimSubmittedDate() == null) {
            claim.setClaimSubmittedDate(Instant.now());
        }
        claim.setUpdatedAt(Instant.now());
        claimRepository.save(claim);

        logHistory(claim.getClaimId(), oldStatus, "SUBMITTED", "Claim submitted electronically via EDI 837 to payer " + claim.getPayerName());

        Map<String, String> simResult = payerSimulationService.evaluateClaimSubmission(claim);
        String simulatedStatus = simResult.get("status");
        String denialReason = simResult.get("reason");

        claim.setStatus(simulatedStatus);
        claim.setDenialReason(denialReason);
        billingPriorityService.calculateBillingPriority(claim);
        arAgingService.calculateArAging(claim);
        claim.setUpdatedAt(Instant.now());
        Claim finalClaim = claimRepository.save(claim);

        if ("ACCEPTED".equals(simulatedStatus)) {
            logHistory(claim.getClaimId(), "SUBMITTED", "ACCEPTED", "Claim accepted by " + claim.getPayerName() + ". Ready for payment processing.");
            alertService.createAlert(claim.getClaimId(), "SUCCESS", "SUCCESS",
                    "Claim Accepted: " + claim.getClaimId(),
                    claim.getClaimId() + " was accepted successfully by " + claim.getPayerName());
        } else if ("DENIED".equals(simulatedStatus)) {
            logHistory(claim.getClaimId(), "SUBMITTED", "DENIED", "Claim rejected by " + claim.getPayerName() + ". Reason: " + denialReason);
            alertService.createAlert(claim.getClaimId(), "DENIAL", "CRITICAL",
                    "Claim Denied: " + claim.getClaimId(),
                    claim.getClaimId() + " was denied due to: " + denialReason);
        } else {
            logHistory(claim.getClaimId(), "SUBMITTED", "PENDING", "Claim in adjudication pipeline.");
        }

        liveUpdateService.broadcastUpdate("CLAIM_SUBMITTED", finalClaim);
        return finalClaim;
    }

    public Claim resubmitClaim(String idOrClaimId) {
        Claim claim = getClaimById(idOrClaimId);
        String oldStatus = claim.getStatus();

        claim.setStatus("RESUBMITTED");
        claim.setUpdatedAt(Instant.now());
        claimRepository.save(claim);

        logHistory(claim.getClaimId(), oldStatus, "RESUBMITTED", "Corrected claim resubmitted to payer " + claim.getPayerName());

        Map<String, String> simResult = payerSimulationService.evaluateClaimSubmission(claim);
        String simulatedStatus = simResult.get("status");
        String denialReason = simResult.get("reason");

        claim.setStatus(simulatedStatus);
        claim.setDenialReason(denialReason);
        billingPriorityService.calculateBillingPriority(claim);
        claim.setUpdatedAt(Instant.now());
        Claim finalClaim = claimRepository.save(claim);

        if ("ACCEPTED".equals(simulatedStatus)) {
            logHistory(claim.getClaimId(), "RESUBMITTED", "ACCEPTED", "Resubmitted claim successfully approved by " + claim.getPayerName());
            alertService.createAlert(claim.getClaimId(), "SUCCESS", "SUCCESS",
                    "Resubmission Accepted: " + claim.getClaimId(),
                    claim.getClaimId() + " approved following post-denial correction!");
        } else if ("DENIED".equals(simulatedStatus)) {
            logHistory(claim.getClaimId(), "RESUBMITTED", "DENIED", "Resubmitted claim denied: " + denialReason);
        }

        liveUpdateService.broadcastUpdate("CLAIM_RESUBMITTED", finalClaim);
        return finalClaim;
    }

    public Claim manualAccept(String idOrClaimId) {
        Claim claim = getClaimById(idOrClaimId);
        String oldStatus = claim.getStatus();

        claim.setStatus("ACCEPTED");
        claim.setDenialReason(null);
        billingPriorityService.calculateBillingPriority(claim);
        claim.setUpdatedAt(Instant.now());
        Claim updated = claimRepository.save(claim);

        logHistory(claim.getClaimId(), oldStatus, "ACCEPTED", "Claim adjudicated & accepted by payer " + claim.getPayerName());
        alertService.createAlert(claim.getClaimId(), "SUCCESS", "SUCCESS",
                "Claim Accepted: " + claim.getClaimId(),
                claim.getClaimId() + " successfully approved.");

        liveUpdateService.broadcastUpdate("CLAIM_UPDATED", updated);
        return updated;
    }

    public Claim manualDeny(String idOrClaimId, String customReason) {
        Claim claim = getClaimById(idOrClaimId);
        String oldStatus = claim.getStatus();

        String reason = (customReason != null && !customReason.isBlank())
                ? customReason
                : (!claim.isAuthorizationAvailable() ? "Missing Authorization" : "Eligibility Issue");

        claim.setStatus("DENIED");
        claim.setDenialReason(reason);
        billingPriorityService.calculateBillingPriority(claim);
        claim.setUpdatedAt(Instant.now());
        Claim updated = claimRepository.save(claim);

        logHistory(claim.getClaimId(), oldStatus, "DENIED", "Claim manually marked as denied. Reason: " + reason);
        alertService.createAlert(claim.getClaimId(), "DENIAL", "CRITICAL",
                "Claim Denied: " + claim.getClaimId(),
                claim.getClaimId() + " was denied: " + reason);

        liveUpdateService.broadcastUpdate("CLAIM_UPDATED", updated);
        return updated;
    }

    public Claim manualSetPending(String idOrClaimId) {
        Claim claim = getClaimById(idOrClaimId);
        String oldStatus = claim.getStatus();

        claim.setStatus("PENDING");
        billingPriorityService.calculateBillingPriority(claim);
        claim.setUpdatedAt(Instant.now());
        Claim updated = claimRepository.save(claim);

        logHistory(claim.getClaimId(), oldStatus, "PENDING", "Claim placed in pending adjudication queue.");
        liveUpdateService.broadcastUpdate("CLAIM_UPDATED", updated);
        return updated;
    }

    public Claim recordFollowUp(String idOrClaimId, String notes) {
        Claim claim = getClaimById(idOrClaimId);
        claim.setLastFollowUpDate(Instant.now());
        if (notes != null && !notes.isBlank()) {
            claim.setFollowUpNotes(notes);
        }
        claim.setUpdatedAt(Instant.now());
        Claim updated = claimRepository.save(claim);

        logHistory(claim.getClaimId(), claim.getStatus(), claim.getStatus(),
                "Billing follow-up performed by staff: " + (notes != null ? notes : "Followed up with payer regarding outstanding balance."));

        liveUpdateService.broadcastUpdate("CLAIM_UPDATED", updated);
        return updated;
    }

    public Claim reviewClaimByInsurer(String idOrClaimId, ClaimReviewRequest request) {
        Claim claim = getClaimById(idOrClaimId);
        UserPrincipal user = SecurityUtils.getCurrentUser();

        // Enforce insurer ownership
        if (user != null && "INSURANCE_COMPANY".equalsIgnoreCase(user.getRole())) {
            String companyId = user.getCompanyId();
            if (claim.getInsuranceCompanyId() != null && !claim.getInsuranceCompanyId().equalsIgnoreCase(companyId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Access Denied: You cannot review claims belonging to another company.");
            }
        }

        String oldStatus = claim.getStatus();
        String newStatus = request.getStatus() != null ? request.getStatus().trim().toUpperCase() : oldStatus;

        claim.setStatus(newStatus);
        claim.setReviewedAt(Instant.now());
        if (user != null) {
            claim.setReviewedBy(user.getName());
        }

        if (request.getComments() != null && !request.getComments().isBlank()) {
            claim.setInsurerComments(request.getComments().trim());
        }

        if ("DENIED".equalsIgnoreCase(newStatus)) {
            String reason = request.getDenialReason() != null && !request.getDenialReason().isBlank()
                    ? request.getDenialReason().trim()
                    : "Denied by insurance payer review";
            claim.setDenialReason(reason);
        } else if ("ACCEPTED".equalsIgnoreCase(newStatus)) {
            claim.setDenialReason(null);
            if (request.getAllowedAmount() != null && request.getAllowedAmount() > 0) {
                claim.setAllowedAmount(request.getAllowedAmount());
            } else if (claim.getAllowedAmount() <= 0) {
                claim.setAllowedAmount(claim.getTotalBillAmount());
            }
            if (request.getPaymentStatus() != null && !request.getPaymentStatus().isBlank()) {
                claim.setPaymentStatus(request.getPaymentStatus().trim().toUpperCase());
            }
        }

        billingPriorityService.calculateBillingPriority(claim);
        arAgingService.calculateArAging(claim);
        claim.setUpdatedAt(Instant.now());
        Claim updated = claimRepository.save(claim);

        logHistory(claim.getClaimId(), oldStatus, newStatus,
                "Claim reviewed by " + (claim.getInsuranceCompanyName() != null ? claim.getInsuranceCompanyName() : "Payer") +
                ": Status transitioned to " + newStatus +
                (claim.getDenialReason() != null ? ". Reason: " + claim.getDenialReason() : ""));

        alertService.createAlert(
                claim.getClaimId(),
                "ACCEPTED".equalsIgnoreCase(newStatus) ? "SUCCESS" : ("DENIED".equalsIgnoreCase(newStatus) ? "DENIAL" : "INFO"),
                "ACCEPTED".equalsIgnoreCase(newStatus) ? "SUCCESS" : ("DENIED".equalsIgnoreCase(newStatus) ? "CRITICAL" : "INFO"),
                "Claim " + claim.getClaimId() + " " + newStatus,
                claim.getClaimId() + " was set to " + newStatus + " by " + (claim.getInsuranceCompanyName() != null ? claim.getInsuranceCompanyName() : "Insurance Payer") + "."
        );

        liveUpdateService.broadcastUpdate("CLAIM_UPDATED", updated);
        return updated;
    }

    public void deleteClaim(String idOrClaimId) {
        Claim claim = getClaimById(idOrClaimId);
        claimRepository.delete(claim);
        liveUpdateService.broadcastUpdate("CLAIM_DELETED", claim.getClaimId());
    }

    private void logHistory(String claimId, String oldStatus, String newStatus, String description) {
        ClaimHistory history = ClaimHistory.builder()
                .claimId(claimId)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .description(description)
                .timestamp(Instant.now())
                .build();
        claimHistoryRepository.save(history);
    }
}
