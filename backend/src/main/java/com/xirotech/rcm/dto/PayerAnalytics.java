package com.xirotech.rcm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayerAnalytics {
    private String payerName;
    private long totalClaims;
    private long acceptedClaims;
    private long deniedClaims;
    private double totalBilled;
    private double totalCollected;
    private double denialRate;
    private double averageSettlementDays;
}
