package com.xirotech.rcm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "claims")
public class Claim {

    @Id
    private String id;

    @Indexed(unique = true)
    private String claimId;

    private String patientName;
    private String patientReference;
    private String payerName;
    private String payerType; // PRIVATE, MEDICARE, MEDICAID, COMMERCIAL
    private double claimAmount;

    // Financial & Billing Priority Fields
    private double totalBillAmount; // Total amount billed (synced with claimAmount)
    private double paidAmount;      // Amount settled so far
    private double pendingAmount;   // totalBillAmount - paidAmount
    private int daysPending;        // Number of days payment has been pending
    private int billingPriorityScore; // 0 - 100 based on Amount (70%) + Days (30%)
    private String billingPriority;   // LOW, MEDIUM, HIGH, CRITICAL
    private String priorityReason;    // Human-readable reason (e.g., "₹1,00,000 pending for 20 days")
    private Instant paymentDueDate;
    private Instant lastFollowUpDate;
    private String followUpNotes;

    private boolean eligibilityVerified;
    private boolean authorizationAvailable;
    private boolean codingComplete;
    private boolean documentationComplete;
    private int previousDenials;

    // Status: CREATED, AI_CHECKED, HIGH_RISK, READY_TO_SUBMIT, SUBMITTED, PENDING, DENIED, CORRECTED, RESUBMITTED, ACCEPTED, PAID
    private String status;

    // AI Risk (Pre-submission Denial Risk)
    private Integer riskScore; // 0 to 100
    private String riskLevel;  // LOW, MEDIUM, HIGH
    private String predictedReason;
    private String recommendation;
    @Builder.Default
    private List<String> detectedReasons = new ArrayList<>();
    @Builder.Default
    private List<String> recommendations = new ArrayList<>();

    private String denialReason;
    
    // Payment Status: UNPAID, PARTIALLY_PAID, PAID, PENDING_PAYER, OVERDUE
    private String paymentStatus;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
