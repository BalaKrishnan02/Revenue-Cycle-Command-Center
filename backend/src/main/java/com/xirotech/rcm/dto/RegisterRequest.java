package com.xirotech.rcm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    // Registration target: "RCM_ADMIN" or "INSURANCE_COMPANY"
    @NotBlank(message = "Registration type is required")
    private String registrationType;

    // Admin fields
    private String fullName;
    private String organizationName;

    // Common
    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    // Insurance Company fields
    private String companyId; // Existing selected company ID, e.g. "INS001"
    private String companyName;
    private String companyCode;
    private String contactPerson;
}
