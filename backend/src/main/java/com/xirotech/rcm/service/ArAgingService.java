package com.xirotech.rcm.service;

import com.xirotech.rcm.dto.ArAgingSummaryResponse;
import com.xirotech.rcm.dto.ArFollowUpRequest;
import com.xirotech.rcm.model.Claim;
import com.xirotech.rcm.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArAgingService {

    private final ClaimRepository claimRepository;

    /**
     * Calculates and updates AR Aging fields for a claim.
     * Strictly based on pending balance and days outstanding (NOT AI denial risk).
     */
    public void calculateArAging(Claim claim) {
        double totalBill = claim.getTotalBillAmount() > 0 ? claim.getTotalBillAmount() : claim.getClaimAmount();
        claim.setTotalBillAmount(totalBill);
        claim.setClaimAmount(totalBill);

        double paid = Math.max(0.0, claim.getPaidAmount());
        claim.setPaidAmount(paid);

        double pending = Math.max(0.0, totalBill - paid);
        claim.setPendingAmount(pending);

        // Calculate days pending from claimSubmittedDate or createdAt
        int days = claim.getDaysPending();
        if (claim.getClaimSubmittedDate() != null) {
            long durationDays = Duration.between(claim.getClaimSubmittedDate(), Instant.now()).toDays();
            days = Math.max(1, (int) durationDays);
            claim.setDaysPending(days);
        } else if (days <= 0 && claim.getCreatedAt() != null) {
            long durationDays = Duration.between(claim.getCreatedAt(), Instant.now()).toDays();
            days = Math.max(1, (int) durationDays);
            claim.setDaysPending(days);
        } else if (days <= 0) {
            days = 1;
            claim.setDaysPending(days);
        }

        // Check if fully paid
        if (pending <= 0.001 || "PAID".equalsIgnoreCase(claim.getPaymentStatus())) {
            claim.setPaymentStatus("PAID");
            claim.setAgingBucket("PAID/CLOSED");
            claim.setAgingStatus("RESOLVED");
            return;
        }

        // Determine Payment Status
        if (paid > 0) {
            claim.setPaymentStatus("PARTIALLY_PAID");
        } else if (claim.getPaymentStatus() == null || claim.getPaymentStatus().isBlank() || "PAID".equalsIgnoreCase(claim.getPaymentStatus())) {
            claim.setPaymentStatus("UNPAID");
        }

        // Assign AR Aging Bucket and Status
        if (days <= 30) {
            claim.setAgingBucket("0-30");
            claim.setAgingStatus("MONITOR");
        } else if (days <= 60) {
            claim.setAgingBucket("31-60");
            claim.setAgingStatus("FOLLOW_UP");
        } else if (days <= 90) {
            claim.setAgingBucket("61-90");
            claim.setAgingStatus("HIGH_ATTENTION");
        } else {
            claim.setAgingBucket("90+");
            claim.setAgingStatus("CRITICAL");
        }

        // Default follow-up status if null
        if (claim.getFollowUpStatus() == null || claim.getFollowUpStatus().isBlank()) {
            claim.setFollowUpStatus(days > 60 ? "CONTACTED" : "NOT_STARTED");
        }
    }

    /**
     * Compute aggregate AR Aging Summary KPIs and 4-bucket breakdown.
     */
    public ArAgingSummaryResponse getArAgingSummary() {
        List<Claim> allClaims = claimRepository.findAll();

        // Refresh calculations in-memory
        for (Claim c : allClaims) {
            calculateArAging(c);
        }

        // Filter active outstanding claims (exclude settled)
        List<Claim> activeClaims = allClaims.stream()
                .filter(c -> !"PAID/CLOSED".equalsIgnoreCase(c.getAgingBucket()) && c.getPendingAmount() > 0.001)
                .toList();

        double totalOutstanding = activeClaims.stream()
                .mapToDouble(Claim::getPendingAmount)
                .sum();

        int totalPendingClaims = activeClaims.size();

        int avgDays = 0;
        int oldestDays = 0;

        if (!activeClaims.isEmpty()) {
            avgDays = (int) Math.round(activeClaims.stream().mapToInt(Claim::getDaysPending).average().orElse(0));
            oldestDays = activeClaims.stream().mapToInt(Claim::getDaysPending).max().orElse(0);
        }

        // Group into 4 standard buckets
        Map<String, ArAgingSummaryResponse.BucketDetail> buckets = new LinkedHashMap<>();

        String[] bucketKeys = {"0-30", "31-60", "61-90", "90+"};
        String[] defaultStatuses = {"MONITOR", "FOLLOW_UP", "HIGH_ATTENTION", "CRITICAL"};

        for (int i = 0; i < bucketKeys.length; i++) {
            String key = bucketKeys[i];
            String status = defaultStatuses[i];

            List<Claim> bucketClaims = activeClaims.stream()
                    .filter(c -> key.equalsIgnoreCase(c.getAgingBucket()))
                    .toList();

            double bucketAmount = bucketClaims.stream().mapToDouble(Claim::getPendingAmount).sum();
            int bucketCount = bucketClaims.size();

            buckets.put(key, ArAgingSummaryResponse.BucketDetail.builder()
                    .claimCount(bucketCount)
                    .amount(bucketAmount)
                    .status(status)
                    .build());
        }

        return ArAgingSummaryResponse.builder()
                .totalOutstanding(totalOutstanding)
                .totalPendingClaims(totalPendingClaims)
                .averageDaysOutstanding(avgDays)
                .oldestPendingDays(oldestDays)
                .buckets(buckets)
                .build();
    }

    /**
     * Return list of active AR aging claims, optionally filtered by bucket (0-30, 31-60, 61-90, 90+).
     * Sorted by daysPending DESC, then pendingAmount DESC.
     */
    public List<Claim> getArAgingClaims(String bucket) {
        List<Claim> allClaims = claimRepository.findAll();

        for (Claim c : allClaims) {
            calculateArAging(c);
        }

        List<Claim> filtered = allClaims.stream()
                .filter(c -> !"PAID/CLOSED".equalsIgnoreCase(c.getAgingBucket()) && c.getPendingAmount() > 0.001)
                .filter(c -> bucket == null || bucket.isBlank() || bucket.equalsIgnoreCase("ALL") || bucket.equalsIgnoreCase(c.getAgingBucket()))
                .sorted(Comparator.comparingInt(Claim::getDaysPending).reversed()
                        .thenComparing(Comparator.comparingDouble(Claim::getPendingAmount).reversed()))
                .collect(Collectors.toList());

        return filtered;
    }

    /**
     * Record follow-up details for an AR claim.
     */
    public Claim recordFollowUp(String idOrClaimId, ArFollowUpRequest request) {
        Claim claim = claimRepository.findById(idOrClaimId)
                .or(() -> claimRepository.findByClaimId(idOrClaimId))
                .orElseThrow(() -> new IllegalArgumentException("Claim not found with id: " + idOrClaimId));

        claim.setLastFollowUpDate(Instant.now());
        if (request.getFollowUpStatus() != null && !request.getFollowUpStatus().isBlank()) {
            claim.setFollowUpStatus(request.getFollowUpStatus());
        }
        if (request.getFollowUpNote() != null) {
            claim.setFollowUpNote(request.getFollowUpNote());
            claim.setFollowUpNotes(request.getFollowUpNote());
        }
        if (request.getNextFollowUpDate() != null) {
            claim.setNextFollowUpDate(request.getNextFollowUpDate());
        }

        calculateArAging(claim);
        return claimRepository.save(claim);
    }
}
