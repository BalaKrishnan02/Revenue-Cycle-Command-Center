package com.xirotech.rcm.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    private String token;
    private String userId;
    private String name;
    private String email;
    private String role; // RCM_ADMIN or INSURANCE_COMPANY
    private String companyId;
    private String companyName;
    private String accountStatus;
    private String message;
}
