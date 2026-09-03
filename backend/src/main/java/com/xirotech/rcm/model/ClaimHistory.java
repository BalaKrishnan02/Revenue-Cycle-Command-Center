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
@Document(collection = "claim_history")
public class ClaimHistory {

    @Id
    private String id;

    private String claimId;
    private String oldStatus;
    private String newStatus;
    private String description;

    @CreatedDate
    private Instant timestamp;
}
