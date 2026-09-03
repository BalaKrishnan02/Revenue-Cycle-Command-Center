package com.xirotech.rcm.service;

import com.xirotech.rcm.dto.ClaimRequest;
import com.xirotech.rcm.dto.PredictionRequest;
import com.xirotech.rcm.dto.PredictionResponse;
import com.xirotech.rcm.exception.ResourceNotFoundException;
import com.xirotech.rcm.model.Claim;
import com.xirotech.rcm.model.ClaimHistory;
import com.xirotech.rcm.repository.ClaimHistoryRepository;
import com.xirotech.rcm.repository.ClaimRepository;
import com.xirotech.rcm.websocket.LiveUpdateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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
    private final MlClientService mlClientService;
    private final PayerSimulationService payerSimulationService;
    private final AlertService alertService;
    private final LiveUpdateService liveUpdateService;
    private final BillingPriorityService billingPriorityService;

    public List<Claim> getAllClaims() {
        return claimRepository.findAllByOrderByCreatedAtDesc();
    }

    public Claim getClaimById(String idOrClaimId) {
        return claimRepository.findByClaimId(idOrClaimId)
                .or(() -> claimRepository.findById(idOrClaimId))
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id or claimId: " + idOrClaimId));
    }

    public List<ClaimHistory> getClaimHistory(String claimId) {
        return claimHistoryRepository.findByClaimIdOrderByTimestampAsc(claimId);
    }

    public Claim createClaim(ClaimRequest request) {
        String generatedClaimId = request.getClaimId() != null && !request.getClaimId().isBlank()
                ? request.getClaimId().trim().toUpperCase()
                : "CLM" + (1000 + (int) (claimRepository.count() + 1));

        String patientRef = request.getPatientReference() != null && !request.getPatientReference().isBlank()
                ? request.getPatientReference().trim()
                : "PT-" + generatedClaimId.replace("CLM", "");

        double billAmount = request.getClaimAmount() != null ? request.getClaimAmount() : 0.0;

        Optional<Claim> existing = claimRepository.findByClaimId(generatedClaimId);
        Claim claim;
        if (existing.isPresent()) {
            claim = existing.get();
            claim.setPatientName(request.getPatientName());
            claim.setPatientReference(patientRef);
            claim.setPayerName(request.getPayerName());
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
                    .payerName(request.getPayerName())
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

        // Calculate billing priority score & reason
        billingPriorityService.calculateBillingPriority(claim);
        Claim saved = claimRepository.save(claim);

        logHistory(saved.getClaimId(), null, "CREATED", "Claim created in billing system. Bill Amount: ₹" + String.format("%,.0f", billAmount));
        liveUpdateService.broadcastUpdate("CLAIM_CREATED", saved);

        return saved;
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
        claim.setUpdatedAt(Instant.now());
        claimRepository.save(claim);

        logHistory(claim.getClaimId(), oldStatus, "SUBMITTED", "Claim submitted electronically via EDI 837 to payer " + claim.getPayerName());

        Map<String, String> simResult = payerSimulationService.evaluateClaimSubmission(claim);
        String simulatedStatus = simResult.get("status");
        String denialReason = simResult.get("reason");

        claim.setStatus(simulatedStatus);
        claim.setDenialReason(denialReason);
        billingPriorityService.calculateBillingPriority(claim);
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
