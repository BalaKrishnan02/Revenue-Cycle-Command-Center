package com.xirotech.rcm.service;

import com.xirotech.rcm.dto.DashboardMetrics;
import com.xirotech.rcm.dto.DenialAnalytics;
import com.xirotech.rcm.dto.PayerAnalytics;
import com.xirotech.rcm.dto.RevenueAnalytics;
import com.xirotech.rcm.model.Claim;
import com.xirotech.rcm.repository.ClaimRepository;
import com.xirotech.rcm.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClaimRepository claimRepository;
    private final PaymentRepository paymentRepository;
    private final BillingPriorityService billingPriorityService;

    public DashboardMetrics getDashboardMetrics() {
        List<Claim> allClaims = claimRepository.findAll();

        long totalClaims = allClaims.size();
        long acceptedClaims = allClaims.stream().filter(c -> "ACCEPTED".equalsIgnoreCase(c.getStatus()) || "PAID".equalsIgnoreCase(c.getStatus())).count();
        long deniedClaims = allClaims.stream().filter(c -> "DENIED".equalsIgnoreCase(c.getStatus())).count();
        long pendingClaims = allClaims.stream().filter(c -> "PENDING".equalsIgnoreCase(c.getStatus()) || "SUBMITTED".equalsIgnoreCase(c.getStatus()) || "RESUBMITTED".equalsIgnoreCase(c.getStatus())).count();
        long paidClaims = allClaims.stream().filter(c -> "PAID".equalsIgnoreCase(c.getStatus()) || "PAID".equalsIgnoreCase(c.getPaymentStatus())).count();
        long highRiskClaims = allClaims.stream().filter(c -> "HIGH".equalsIgnoreCase(c.getRiskLevel())).count();
        long mediumRiskClaims = allClaims.stream().filter(c -> "MEDIUM".equalsIgnoreCase(c.getRiskLevel())).count();
        long lowRiskClaims = allClaims.stream().filter(c -> "LOW".equalsIgnoreCase(c.getRiskLevel())).count();

        double totalClaimAmount = allClaims.stream().mapToDouble(c -> c.getTotalBillAmount() > 0 ? c.getTotalBillAmount() : c.getClaimAmount()).sum();
        double revenueReceived = allClaims.stream().mapToDouble(Claim::getPaidAmount).sum();

        // Total Outstanding = sum of pendingAmount for all claims where paymentStatus != 'PAID'
        double totalOutstanding = allClaims.stream()
                .filter(c -> !"PAID".equalsIgnoreCase(c.getPaymentStatus()) && c.getPendingAmount() > 0.001)
                .mapToDouble(Claim::getPendingAmount)
                .sum();

        // High Priority Outstanding = sum of pendingAmount from CRITICAL + HIGH claims
        double highPriorityOutstanding = allClaims.stream()
                .filter(c -> !"PAID".equalsIgnoreCase(c.getPaymentStatus()) && c.getPendingAmount() > 0.001)
                .filter(c -> "CRITICAL".equalsIgnoreCase(c.getBillingPriority()) || "HIGH".equalsIgnoreCase(c.getBillingPriority()))
                .mapToDouble(Claim::getPendingAmount)
                .sum();

        long priorityQueueCount = allClaims.stream()
                .filter(c -> !"PAID".equalsIgnoreCase(c.getPaymentStatus()) && c.getPendingAmount() > 0.001)
                .count();

        double pendingRevenue = totalOutstanding;
        double deniedRevenue = allClaims.stream()
                .filter(c -> "DENIED".equalsIgnoreCase(c.getStatus()))
                .mapToDouble(c -> c.getTotalBillAmount() > 0 ? c.getTotalBillAmount() : c.getClaimAmount()).sum();

        // Calculate rates safely
        long submittedClaimsCount = allClaims.stream()
                .filter(c -> !"CREATED".equalsIgnoreCase(c.getStatus()) && !"AI_CHECKED".equalsIgnoreCase(c.getStatus()) && !"HIGH_RISK".equalsIgnoreCase(c.getStatus()) && !"READY_TO_SUBMIT".equalsIgnoreCase(c.getStatus()) && !"CORRECTED".equalsIgnoreCase(c.getStatus()))
                .count();

        double acceptanceRate = submittedClaimsCount > 0 ? ((double) acceptedClaims / submittedClaimsCount) * 100.0 : 0.0;
        double denialRate = submittedClaimsCount > 0 ? ((double) deniedClaims / submittedClaimsCount) * 100.0 : 0.0;

        Map<String, Long> statusBreakdown = allClaims.stream()
                .collect(Collectors.groupingBy(c -> c.getStatus() != null ? c.getStatus() : "UNKNOWN", Collectors.counting()));

        Map<String, Long> riskBreakdown = new HashMap<>();
        riskBreakdown.put("LOW", lowRiskClaims);
        riskBreakdown.put("MEDIUM", mediumRiskClaims);
        riskBreakdown.put("HIGH", highRiskClaims);

        Map<String, Long> billingPriorityBreakdown = new HashMap<>();
        billingPriorityBreakdown.put("CRITICAL", allClaims.stream().filter(c -> "CRITICAL".equalsIgnoreCase(c.getBillingPriority()) && !"PAID".equalsIgnoreCase(c.getPaymentStatus())).count());
        billingPriorityBreakdown.put("HIGH", allClaims.stream().filter(c -> "HIGH".equalsIgnoreCase(c.getBillingPriority()) && !"PAID".equalsIgnoreCase(c.getPaymentStatus())).count());
        billingPriorityBreakdown.put("MEDIUM", allClaims.stream().filter(c -> "MEDIUM".equalsIgnoreCase(c.getBillingPriority()) && !"PAID".equalsIgnoreCase(c.getPaymentStatus())).count());
        billingPriorityBreakdown.put("LOW", allClaims.stream().filter(c -> "LOW".equalsIgnoreCase(c.getBillingPriority()) && !"PAID".equalsIgnoreCase(c.getPaymentStatus())).count());

        return DashboardMetrics.builder()
                .totalClaims(totalClaims)
                .acceptedClaims(acceptedClaims)
                .deniedClaims(deniedClaims)
                .pendingClaims(pendingClaims)
                .paidClaims(paidClaims)
                .highRiskClaims(highRiskClaims)
                .mediumRiskClaims(mediumRiskClaims)
                .lowRiskClaims(lowRiskClaims)
                .totalClaimAmount(Math.round(totalClaimAmount * 100.0) / 100.0)
                .revenueReceived(Math.round(revenueReceived * 100.0) / 100.0)
                .pendingRevenue(Math.round(pendingRevenue * 100.0) / 100.0)
                .deniedRevenue(Math.round(deniedRevenue * 100.0) / 100.0)
                .totalOutstanding(Math.round(totalOutstanding * 100.0) / 100.0)
                .highPriorityOutstanding(Math.round(highPriorityOutstanding * 100.0) / 100.0)
                .priorityQueueCount(priorityQueueCount)
                .acceptanceRate(Math.round(acceptanceRate * 10.0) / 10.0)
                .denialRate(Math.round(denialRate * 10.0) / 10.0)
                .targetAvoidableReduction(30.0)
                .statusBreakdown(statusBreakdown)
                .riskBreakdown(riskBreakdown)
                .billingPriorityBreakdown(billingPriorityBreakdown)
                .build();
    }

    public List<DenialAnalytics> getDenialAnalytics() {
        List<Claim> allClaims = claimRepository.findAll();
        List<Claim> deniedClaims = allClaims.stream()
                .filter(c -> "DENIED".equalsIgnoreCase(c.getStatus()) || (c.getDenialReason() != null && !c.getDenialReason().isBlank()))
                .toList();

        Map<String, List<Claim>> groupedByReason = new HashMap<>();

        for (Claim claim : deniedClaims) {
            String reason = "General Payer Policy";
            String raw = claim.getDenialReason() != null ? claim.getDenialReason() : (claim.getPredictedReason() != null ? claim.getPredictedReason() : "General");
            if (raw.toLowerCase().contains("eligib")) {
                reason = "Eligibility & Coverage Issues";
            } else if (raw.toLowerCase().contains("auth")) {
                reason = "Missing / Expired Authorization";
            } else if (raw.toLowerCase().contains("cod")) {
                reason = "Incorrect Diagnosis / CPT Coding";
            } else if (raw.toLowerCase().contains("doc")) {
                reason = "Incomplete Clinical Documentation";
            } else if (raw.toLowerCase().contains("threshold") || raw.toLowerCase().contains("rule")) {
                reason = "Payer Policy / Limit Exceeded";
            }

            groupedByReason.computeIfAbsent(reason, k -> new ArrayList<>()).add(claim);
        }

        if (groupedByReason.isEmpty()) {
            groupedByReason.put("Missing / Expired Authorization", List.of());
            groupedByReason.put("Eligibility & Coverage Issues", List.of());
            groupedByReason.put("Incorrect Diagnosis / CPT Coding", List.of());
            groupedByReason.put("Incomplete Clinical Documentation", List.of());
        }

        long totalDeniedCount = Math.max(1, deniedClaims.size());
        List<DenialAnalytics> list = new ArrayList<>();

        for (Map.Entry<String, List<Claim>> entry : groupedByReason.entrySet()) {
            long count = entry.getValue().size();
            double sum = entry.getValue().stream().mapToDouble(c -> c.getTotalBillAmount() > 0 ? c.getTotalBillAmount() : c.getClaimAmount()).sum();
            double pct = ((double) count / totalDeniedCount) * 100.0;

            list.add(DenialAnalytics.builder()
                    .reason(entry.getKey())
                    .count(count)
                    .totalAmount(Math.round(sum * 100.0) / 100.0)
                    .percentage(Math.round(pct * 10.0) / 10.0)
                    .build());
        }

        list.sort((a, b) -> Long.compare(b.getCount(), a.getCount()));
        return list;
    }

    public List<PayerAnalytics> getPayerAnalytics() {
        List<Claim> allClaims = claimRepository.findAll();
        Map<String, List<Claim>> byPayer = allClaims.stream()
                .collect(Collectors.groupingBy(Claim::getPayerName));

        List<PayerAnalytics> result = new ArrayList<>();

        for (Map.Entry<String, List<Claim>> entry : byPayer.entrySet()) {
            String payer = entry.getKey();
            List<Claim> claims = entry.getValue();

            long total = claims.size();
            long accepted = claims.stream().filter(c -> "ACCEPTED".equalsIgnoreCase(c.getStatus()) || "PAID".equalsIgnoreCase(c.getStatus())).count();
            long denied = claims.stream().filter(c -> "DENIED".equalsIgnoreCase(c.getStatus())).count();
            double billed = claims.stream().mapToDouble(c -> c.getTotalBillAmount() > 0 ? c.getTotalBillAmount() : c.getClaimAmount()).sum();
            double collected = claims.stream().mapToDouble(Claim::getPaidAmount).sum();
            double denialRate = total > 0 ? ((double) denied / total) * 100.0 : 0.0;

            result.add(PayerAnalytics.builder()
                    .payerName(payer)
                    .totalClaims(total)
                    .acceptedClaims(accepted)
                    .deniedClaims(denied)
                    .totalBilled(Math.round(billed * 100.0) / 100.0)
                    .totalCollected(Math.round(collected * 100.0) / 100.0)
                    .denialRate(Math.round(denialRate * 10.0) / 10.0)
                    .averageSettlementDays(14.5)
                    .build());
        }

        result.sort((a, b) -> Double.compare(b.getTotalBilled(), a.getTotalBilled()));
        return result;
    }

    public List<RevenueAnalytics> getRevenueAnalytics() {
        List<Claim> all = claimRepository.findAll();
        double totalBilled = all.stream().mapToDouble(c -> c.getTotalBillAmount() > 0 ? c.getTotalBillAmount() : c.getClaimAmount()).sum();
        double totalCollected = all.stream().mapToDouble(Claim::getPaidAmount).sum();

        List<RevenueAnalytics> list = new ArrayList<>();
        list.add(new RevenueAnalytics("Week 1", 45000, 38000, 7000, 5000));
        list.add(new RevenueAnalytics("Week 2", 72000, 60000, 12000, 8000));
        list.add(new RevenueAnalytics("Week 3", 95000, 82000, 13000, 6500));
        list.add(new RevenueAnalytics("Week 4 (Current)", totalBilled, totalCollected, Math.max(0, totalBilled - totalCollected), 14000));

        return list;
    }
}
