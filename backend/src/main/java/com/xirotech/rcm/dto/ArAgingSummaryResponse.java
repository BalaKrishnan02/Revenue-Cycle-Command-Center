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
public class ArAgingSummaryResponse {
    private double totalOutstanding;
    private int totalPendingClaims;
    private int averageDaysOutstanding;
    private int oldestPendingDays;
    private Map<String, BucketDetail> buckets;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BucketDetail {
        private int claimCount;
        private double amount;
        private String status; // MONITOR, FOLLOW_UP, HIGH_ATTENTION, CRITICAL
    }
}
