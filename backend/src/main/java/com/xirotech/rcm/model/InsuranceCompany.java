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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "insurance_companies")
public class InsuranceCompany {

    @Id
    private String id; // e.g. "INS001"

    @Indexed(unique = true)
    private String companyCode; // e.g. "NOVA001"

    private String companyName; // e.g. "Nova Health Insurance"

    private String contactPerson;

    private String email;

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
