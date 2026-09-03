package com.xirotech.rcm.service;

import com.xirotech.rcm.model.Claim;
import com.xirotech.rcm.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingPriorityService {

    private final ClaimRepository claimRepository;

    /**
     * Calculate and update billing priority fields on a Claim object.
     * Higher unpaid amount + longer pending duration = Higher priority.
     * Does NOT use AI denial risk score.
     */
    public void calculateBillingPriority(Claim claim) {
        // 1. Total Bill & Paid amounts
        double totalBill = claim.getTotalBillAmount() > 0 ? claim.getTotalBillAmount() : claim.getClaimAmount();
        claim.setTotalBillAmount(totalBill);
        claim.setClaimAmount(totalBill);

        double paid = Math.max(0.0, claim.getPaidAmount());
        claim.setPaidAmount(paid);

        double pending = Math.max(0.0, totalBill - paid);
        claim.setPendingAmount(pending);

        // Determine Payment Status
        if (pending <= 0.001) {
            claim.setPaymentStatus("PAID");
            claim.setBillingPriorityScore(0);
            claim.setBillingPriority("LOW");
            claim.setPriorityReason("Full bill amount settled");
            return;
        } else if (paid > 0) {
            claim.setPaymentStatus("PARTIALLY_PAID");
        } else if ("PAID".equalsIgnoreCase(claim.getPaymentStatus())) {
            claim.setPaymentStatus("UNPAID");
        } else if (claim.getPaymentStatus() == null || claim.getPaymentStatus().isBlank()) {
            claim.setPaymentStatus("UNPAID");
        }

        // Calculate days pending
        int days = claim.getDaysPending();
        if (days <= 0 && claim.getCreatedAt() != null) {
            long durationDays = Duration.between(claim.getCreatedAt(), Instant.now()).toDays();
            days = Math.max(1, (int) durationDays);
            claim.setDaysPending(days);
        } else if (days <= 0) {
            days = 1;
            claim.setDaysPending(days);
        }

        if (days > 30 && !"PARTIALLY_PAID".equalsIgnoreCase(claim.getPaymentStatus())) {
            claim.setPaymentStatus("OVERDUE");
        }

        // 2. Amount Score (0 - 100)
        // >= 100,000 -> 100
        // 50,001 - 100,000 -> 80
        // 25,001 - 50,000 -> 60
        // 10,001 - 25,000 -> 40
        // 1 - 10,000 -> 20
        // 0 -> 0
        int amountScore = calculateAmountScore(pending);

        // 3. Pending Days Score (0 - 100)
        // > 30 days -> 100
        // 16 - 30 days -> 75
        // 8 - 15 days -> 50
        // 4 - 7 days -> 25
        // 0 - 3 days -> 10
        int daysScore = calculateDaysScore(days);

        // 4. Combined Weighted Priority Score: 70% Amount + 30% Days
        int score = (int) Math.round((amountScore * 0.70) + (daysScore * 0.30));
        score = Math.min(100, Math.max(0, score));
        claim.setBillingPriorityScore(score);

        // 5. Priority Level: 0-29 LOW, 30-54 MEDIUM, 55-79 HIGH, 80-100 CRITICAL
        String priority;
        if (score >= 80) {
            priority = "CRITICAL";
        } else if (score >= 55) {
            priority = "HIGH";
        } else if (score >= 30) {
            priority = "MEDIUM";
        } else {
            priority = "LOW";
        }
        claim.setBillingPriority(priority);

        // 6. Generate Human-Readable Priority Reason
        claim.setPriorityReason(generatePriorityReason(claim, pending, days, priority));
    }

    private int calculateAmountScore(double pending) {
        if (pending <= 0) {
            return 0;
        } else if (pending <= 10000) {
            return 20;
        } else if (pending <= 25000) {
            return 40;
        } else if (pending <= 50000) {
            return 60;
        } else if (pending < 100000) {
            return 80;
        } else {
            return 100; // ₹1,00,000 and above
        }
    }

    private int calculateDaysScore(int days) {
        if (days <= 3) {
            return 10;
        } else if (days <= 7) {
            return 25;
        } else if (days <= 15) {
            return 50;
        } else if (days <= 30) {
            return 75;
        } else {
            return 100;
        }
    }

    private String generatePriorityReason(Claim claim, double pending, int days, String priority) {
        String formattedPending = "₹" + String.format(Locale.US, "%,d", Math.round(pending));
        String formattedPaid = "₹" + String.format(Locale.US, "%,d", Math.round(claim.getPaidAmount()));

        if ("PARTIALLY_PAID".equalsIgnoreCase(claim.getPaymentStatus())) {
            return "Partial payment of " + formattedPaid + " received; " + formattedPending + " still outstanding for " + days + " days";
        }

        if (days > 30) {
            return "Payment overdue (" + formattedPending + ") for more than 30 days (" + days + " days total)";
        }

        if (pending >= 100000) {
            return "High-value bill: " + formattedPending + " pending for " + days + " days";
        }

        return formattedPending + " pending for " + days + " days from " + (claim.getPayerName() != null ? claim.getPayerName() : "payer");
    }

    /**
     * Get claims that have outstanding balance, sorted by Billing Priority Score DESC, then pendingAmount DESC.
     * Excludes claims with paymentStatus == PAID or pendingAmount <= 0.
     */
    public List<Claim> getPriorityQueue() {
        List<Claim> allClaims = claimRepository.findAll();

        return allClaims.stream()
                .filter(c -> !"PAID".equalsIgnoreCase(c.getPaymentStatus()) && c.getPendingAmount() > 0.001)
                .sorted(Comparator.comparingInt(Claim::getBillingPriorityScore).reversed()
                        .thenComparing(Comparator.comparingDouble(Claim::getPendingAmount).reversed()))
                .toList();
    }
}
