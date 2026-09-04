package com.xirotech.rcm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyRequest {
    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Company code is required")
    private String companyCode;

    private String contactPerson;
    private String email;
    private String status; // ACTIVE, INACTIVE
}
