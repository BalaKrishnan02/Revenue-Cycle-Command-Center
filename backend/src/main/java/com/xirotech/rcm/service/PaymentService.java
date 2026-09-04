package com.xirotech.rcm.service;

import com.xirotech.rcm.dto.PaymentRequest;
import com.xirotech.rcm.exception.ResourceNotFoundException;
import com.xirotech.rcm.model.Claim;
import com.xirotech.rcm.model.ClaimHistory;
import com.xirotech.rcm.model.Payment;
import com.xirotech.rcm.repository.ClaimHistoryRepository;
import com.xirotech.rcm.repository.ClaimRepository;
import com.xirotech.rcm.repository.PaymentRepository;
import com.xirotech.rcm.security.SecurityUtils;
import com.xirotech.rcm.security.UserPrincipal;
import com.xirotech.rcm.websocket.LiveUpdateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ClaimRepository claimRepository;
    private final ClaimHistoryRepository claimHistoryRepository;
    private final AlertService alertService;
    private final LiveUpdateService liveUpdateService;
    private final BillingPriorityService billingPriorityService;
    private final ArAgingService arAgingService;
    private final LifecycleEmailService lifecycleEmailService;

    public List<Payment> getAllPayments() {
        UserPrincipal user = SecurityUtils.getCurrentUser();
        if (user != null && "INSURANCE_COMPANY".equalsIgnoreCase(user.getRole())) {
            String companyId = user.getCompanyId();
            log.info("Enforcing payment data isolation: fetching payments exclusively for companyId={}", companyId);
            return paymentRepository.findByInsuranceCompanyIdOrderByCreatedAtDesc(companyId);
        }
        return paymentRepository.findAllByOrderByCreatedAtDesc();
    }

    public Payment processPayment(String claimId, PaymentRequest request) {
        Claim claim = claimRepository.findByClaimId(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found: " + claimId));

        double totalBill = claim.getTotalBillAmount() > 0 ? claim.getTotalBillAmount() : claim.getClaimAmount();
        double currentPaid = claim.getPaidAmount();
        double remainingPending = Math.max(0.0, totalBill - currentPaid);

        // Determine payment amount
        double amountToPay;
        if (request != null && request.getAmount() != null && request.getAmount() > 0) {
            amountToPay = Math.min(request.getAmount(), remainingPending > 0 ? remainingPending : request.getAmount());
        } else {
            amountToPay = remainingPending > 0 ? remainingPending : totalBill;
        }

        String ref = (request != null && request.getTransactionReference() != null && !request.getTransactionReference().isBlank())
                ? request.getTransactionReference()
                : "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        String paymentId = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 1. Create Payment Transaction Record with company info
        Payment payment = Payment.builder()
                .paymentId(paymentId)
                .claimId(claim.getClaimId())
                .insuranceCompanyId(claim.getInsuranceCompanyId())
                .insuranceCompanyName(claim.getInsuranceCompanyName())
                .payerName(claim.getPayerName())
                .claimAmount(totalBill)
                .paidAmount(amountToPay)
                .paymentStatus("PAID")
                .transactionReference(ref)
                .paymentDate(Instant.now())
                .createdAt(Instant.now())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        // 2. Update Claim Financial State
        double newPaidTotal = currentPaid + amountToPay;
        claim.setPaidAmount(newPaidTotal);
        claim.setTotalBillAmount(totalBill);
        claim.setClaimAmount(totalBill);
        double newPending = Math.max(0.0, totalBill - newPaidTotal);
        claim.setPendingAmount(newPending);

        String oldStatus = claim.getStatus();
        String oldPriority = claim.getBillingPriority();
        int oldPriorityScore = claim.getBillingPriorityScore();

        if (newPending <= 0.001) {
            claim.setStatus("PAID");
            claim.setPaymentStatus("PAID");
        } else {
            claim.setPaymentStatus("PARTIALLY_PAID");
        }

        // 3. Recalculate Billing Priority and AR Aging
        billingPriorityService.calculateBillingPriority(claim);
        claim.setLastPaymentDate(Instant.now());
        arAgingService.calculateArAging(claim);
        claim.setUpdatedAt(Instant.now());
        Claim updatedClaim = claimRepository.save(claim);

        // 4. Log History
        String histDesc = newPending <= 0.001
                ? "Full payment of ₹" + String.format("%,.2f", amountToPay) + " settled by " + claim.getPayerName() + ". Claim is now fully PAID."
                : "Partial payment of ₹" + String.format("%,.2f", amountToPay) + " recorded. Remaining pending balance: ₹" + String.format("%,.2f", newPending) +
                  " (Priority updated from " + oldPriority + " [" + oldPriorityScore + "] to " + claim.getBillingPriority() + " [" + claim.getBillingPriorityScore() + "])";

        claimHistoryRepository.save(ClaimHistory.builder()
                .claimId(claim.getClaimId())
                .oldStatus(oldStatus)
                .newStatus(claim.getStatus())
                .description(histDesc)
                .timestamp(Instant.now())
                .build());

        // 5. Create Alert
        alertService.createAlert(
                claim.getClaimId(),
                "PAYMENT",
                "SUCCESS",
                "Payment Recorded: " + claim.getClaimId(),
                "Recorded payment of ₹" + String.format("%,.2f", amountToPay) + " for " + claim.getClaimId() + " (Pending: ₹" + String.format("%,.2f", newPending) + ")"
        );

        liveUpdateService.broadcastUpdate("PAYMENT_PROCESSED", savedPayment);
        liveUpdateService.broadcastUpdate("CLAIM_UPDATED", updatedClaim);

        // Dispatch Stage 5: Payment Remittance / Settlement progress email to patient/user
        lifecycleEmailService.sendStageProgressEmail(
                updatedClaim,
                5,
                newPending <= 0.001 ? "Stage 5: Final Payment Settlement Disbursed" : "Stage 5: Payment Remittance Recorded (Partial)",
                histDesc
        );

        return savedPayment;
    }
}
