package com.xirotech.rcm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "email_notifications")
public class ClaimEmailNotification {

    @Id
    private String id;

    @Indexed
    private String claimId;

    @Indexed
    private String patientEmail;

    private String patientName;
    private String patientReference;

    private int stageIndex; // 1 to 5
    private String stageName; // e.g. "Stage 1: Claim Intake & Registration"
    private String claimStatus; // e.g. CREATED, AI_CHECKED, SUBMITTED, ACCEPTED, DENIED, PAID

    private double billedAmount;
    private String payerName;

    private String subject;
    private String htmlBody;

    private String deliveryStatus; // DELIVERED, DISPATCHED_SMTP, RECORDED, FAILED
    private String deliveryDetails;

    @CreatedDate
    private Instant sentAt;
}
