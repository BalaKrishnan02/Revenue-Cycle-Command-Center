package com.xirotech.rcm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionRequest {
    private boolean eligibilityVerified;
    private boolean authorizationAvailable;
    private boolean codingComplete;
    private boolean documentationComplete;
    private double claimAmount;
    private int previousDenials;
    private Double payerRiskScore;
}
