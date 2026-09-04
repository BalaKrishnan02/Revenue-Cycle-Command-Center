package com.xirotech.rcm.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClaimRequest {

    private String claimId;

    @NotBlank(message = "Patient name is required")
    private String patientName;

    private String patientReference;

    @NotBlank(message = "Payer name is required")
    private String payerName;
    private String insuranceCompanyId;
    private String insuranceCompanyName;

    private String payerType; // PRIVATE, MEDICARE, MEDICAID, COMMERCIAL

    @NotNull(message = "Claim amount is required")
    @DecimalMin(value = "0.01", message = "Claim amount must be positive")
    private Double claimAmount;

    private boolean eligibilityVerified;
    private boolean authorizationAvailable;
    private boolean codingComplete;
    private boolean documentationComplete;
    private int previousDenials;
}
