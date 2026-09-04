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
@Document(collection = "alerts")
public class Alert {

    @Id
    private String id;

    private String alertId;
    private String claimId;

    @org.springframework.data.mongodb.core.index.Indexed
    private String insuranceCompanyId;

    private String insuranceCompanyName;

    private String type; // HIGH_RISK, MISSING_AUTH, DENIAL, PAYMENT, SUCCESS, INFO
    private String severity; // CRITICAL, WARNING, INFO, SUCCESS
    private String title;
    private String message;
    private boolean resolved;

    @CreatedDate
    private Instant createdAt;
}
