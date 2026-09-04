package com.xirotech.rcm.controller;

import com.xirotech.rcm.dto.ClaimRequest;
import com.xirotech.rcm.dto.ClaimReviewRequest;
import com.xirotech.rcm.dto.PaymentRequest;
import com.xirotech.rcm.model.Claim;
import com.xirotech.rcm.model.ClaimEmailNotification;
import com.xirotech.rcm.model.ClaimHistory;
import com.xirotech.rcm.model.Payment;
import com.xirotech.rcm.service.BillingPriorityService;
import com.xirotech.rcm.service.ClaimService;
import com.xirotech.rcm.service.LifecycleEmailService;
import com.xirotech.rcm.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;
    private final PaymentService paymentService;
    private final BillingPriorityService billingPriorityService;
    private final LifecycleEmailService lifecycleEmailService;

    @GetMapping("/api/claims")
    public ResponseEntity<List<Claim>> getAllClaims() {
        return ResponseEntity.ok(claimService.getAllClaims());
    }

    @GetMapping("/api/billing-priority")
    public ResponseEntity<List<Claim>> getBillingPriorityQueue() {
        return ResponseEntity.ok(billingPriorityService.getPriorityQueue());
    }

    @PostMapping("/api/claims")
    public ResponseEntity<Claim> createClaim(@Valid @RequestBody ClaimRequest request) {
        return new ResponseEntity<>(claimService.createClaim(request), HttpStatus.CREATED);
    }

    @GetMapping("/api/claims/{id}")
    public ResponseEntity<Claim> getClaimById(@PathVariable String id) {
        return ResponseEntity.ok(claimService.getClaimById(id));
    }

    @GetMapping("/api/claims/{id}/history")
    public ResponseEntity<List<ClaimHistory>> getClaimHistory(@PathVariable String id) {
        Claim claim = claimService.getClaimById(id);
        return ResponseEntity.ok(claimService.getClaimHistory(claim.getClaimId()));
    }

    @PutMapping("/api/claims/{id}")
    public ResponseEntity<Claim> updateClaim(@PathVariable String id, @RequestBody ClaimRequest request) {
        return ResponseEntity.ok(claimService.updateOrCorrectClaim(id, request));
    }

    @DeleteMapping("/api/claims/{id}")
    public ResponseEntity<Map<String, String>> deleteClaim(@PathVariable String id) {
        claimService.deleteClaim(id);
        return ResponseEntity.ok(Map.of("message", "Claim successfully deleted", "claimId", id));
    }

    @PostMapping("/api/claims/{id}/predict")
    public ResponseEntity<Claim> predictRisk(@PathVariable String id) {
        return ResponseEntity.ok(claimService.predictClaimRisk(id));
    }

    @PostMapping("/api/claims/{id}/submit")
    public ResponseEntity<Claim> submitClaim(@PathVariable String id) {
        return ResponseEntity.ok(claimService.submitClaim(id));
    }

    @PostMapping("/api/claims/{id}/correct")
    public ResponseEntity<Claim> correctClaim(@PathVariable String id, @RequestBody ClaimRequest request) {
        return ResponseEntity.ok(claimService.updateOrCorrectClaim(id, request));
    }

    @PostMapping("/api/claims/{id}/resubmit")
    public ResponseEntity<Claim> resubmitClaim(@PathVariable String id) {
        return ResponseEntity.ok(claimService.resubmitClaim(id));
    }

    @PostMapping("/api/claims/{id}/accept")
    public ResponseEntity<Claim> acceptClaim(@PathVariable String id) {
        return ResponseEntity.ok(claimService.manualAccept(id));
    }

    @PostMapping("/api/claims/{id}/deny")
    public ResponseEntity<Claim> denyClaim(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        String reason = (body != null && body.containsKey("reason")) ? body.get("reason") : null;
        return ResponseEntity.ok(claimService.manualDeny(id, reason));
    }

    @PostMapping("/api/claims/{id}/pending")
    public ResponseEntity<Claim> setPending(@PathVariable String id) {
        return ResponseEntity.ok(claimService.manualSetPending(id));
    }

    @PostMapping("/api/claims/{id}/review")
    public ResponseEntity<Claim> reviewClaim(@PathVariable String id, @RequestBody ClaimReviewRequest request) {
        return ResponseEntity.ok(claimService.reviewClaimByInsurer(id, request));
    }

    @PostMapping({"/api/claims/{id}/pay", "/api/claims/{id}/payment"})
    public ResponseEntity<Payment> payClaim(@PathVariable String id, @RequestBody(required = false) PaymentRequest request) {
        Claim claim = claimService.getClaimById(id);
        return ResponseEntity.ok(paymentService.processPayment(claim.getClaimId(), request != null ? request : new PaymentRequest()));
    }

    @PostMapping("/api/claims/{id}/partial-payment")
    public ResponseEntity<Payment> recordPartialPayment(@PathVariable String id, @RequestBody(required = false) PaymentRequest request) {
        Claim claim = claimService.getClaimById(id);
        return ResponseEntity.ok(paymentService.processPayment(claim.getClaimId(), request != null ? request : new PaymentRequest()));
    }

    @PostMapping("/api/claims/{id}/follow-up")
    public ResponseEntity<Claim> recordFollowUp(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        String notes = (body != null && body.containsKey("notes")) ? body.get("notes") : "Followed up with payer regarding pending bill.";
        return ResponseEntity.ok(claimService.recordFollowUp(id, notes));
    }

    @GetMapping("/api/claims/{id}/emails")
    public ResponseEntity<List<ClaimEmailNotification>> getClaimEmails(@PathVariable String id) {
        Claim claim = claimService.getClaimById(id);
        return ResponseEntity.ok(lifecycleEmailService.getEmailsForClaim(claim.getClaimId()));
    }

    @PostMapping("/api/claims/{id}/send-stage-email")
    public ResponseEntity<ClaimEmailNotification> sendStageEmail(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        Claim claim = claimService.getClaimById(id);
        String recipient = (body != null && body.containsKey("email")) ? body.get("email") : null;
        return ResponseEntity.ok(lifecycleEmailService.triggerManualStageEmail(claim, recipient));
    }
}

