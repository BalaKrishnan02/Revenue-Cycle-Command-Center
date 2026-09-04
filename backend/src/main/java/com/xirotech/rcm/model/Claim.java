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
    private String patientEmail;
    private boolean patientEmailVerified;

    // Insurance Company Details
    @Indexed
    private String insuranceCompanyId;   // e.g. "INS001"
    private String insuranceCompanyName; // e.g. "Nova Health Insurance"

    private String payerName; // Kept synced with insuranceCompanyName for backwards compatibility
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

    // AR Aging Fields (Accounts Receivable Tracking)
    private double allowedAmount;
    private Instant claimSubmittedDate;
    private Instant lastPaymentDate;
    private String agingBucket;    // 0-30, 31-60, 61-90, 90+, PAID/CLOSED
    private String agingStatus;    // MONITOR, FOLLOW_UP, HIGH_ATTENTION, CRITICAL
    private Instant nextFollowUpDate;
    private String followUpStatus; // NOT_STARTED, CONTACTED, WAITING_FOR_PAYER, ESCALATED, RESOLVED
    private String followUpNote;

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
    private String insurerComments;
    private Instant reviewedAt;
    private String reviewedBy;
    
    // Payment Status: UNPAID, PARTIALLY_PAID, PAID, PENDING_PAYER, OVERDUE
    private String paymentStatus;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
