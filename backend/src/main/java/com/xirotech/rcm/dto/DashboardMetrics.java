package com.xirotech.rcm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetrics {
    private long totalClaims;
    private long acceptedClaims;
    private long deniedClaims;
    private long pendingClaims;
    private long paidClaims;
    private long highRiskClaims;
    private long mediumRiskClaims;
    private long lowRiskClaims;

    private double totalClaimAmount;
    private double revenueReceived;
    private double pendingRevenue;
    private double deniedRevenue;

    // Smart Billing Priority KPIs
    private double totalOutstanding;        // Total unpaid / pending bill balance
    private double highPriorityOutstanding; // Outstanding amount from CRITICAL + HIGH priority bills
    private long priorityQueueCount;        // Total active claims in priority queue

    private double acceptanceRate; // %
    private double denialRate;     // %
    private double targetAvoidableReduction; // 30% prototype benchmark

    private Map<String, Long> statusBreakdown;
    private Map<String, Long> riskBreakdown;
    private Map<String, Long> billingPriorityBreakdown;
}
