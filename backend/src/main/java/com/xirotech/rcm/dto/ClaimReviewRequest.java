package com.xirotech.rcm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClaimReviewRequest {
    // UNDER_REVIEW, PENDING, ACCEPTED, DENIED
    private String status;
    private String denialReason;
    private Double allowedAmount;
    private String comments;
    private String paymentStatus;
}
