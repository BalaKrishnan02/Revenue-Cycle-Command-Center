package com.xirotech.rcm.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String fullName;

    @Indexed(unique = true)
    private String email;

    @JsonIgnore
    private String passwordHash;

    // RCM_ADMIN or INSURANCE_COMPANY
    private String role;

    // For INSURANCE_COMPANY users:
    private String insuranceCompanyId;
    private String insuranceCompanyName;
    private String contactPerson;

    // For RCM_ADMIN users:
    private String organizationName;

    // ACTIVE, PENDING_APPROVAL, SUSPENDED
    @Builder.Default
    private String accountStatus = "ACTIVE";

    @Builder.Default
    private boolean active = true;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
