package com.xirotech.rcm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payments")
public class Payment {

    @Id
    private String id;

    private String paymentId;
    private String claimId;
    private String insuranceCompanyId;
    private String insuranceCompanyName;
    private String payerName;
    private double claimAmount;
    private double paidAmount;
    private String paymentStatus; // PAID, PARTIAL, PENDING
    private String transactionReference;
    private Instant paymentDate;

    @CreatedDate
    private Instant createdAt;
}
