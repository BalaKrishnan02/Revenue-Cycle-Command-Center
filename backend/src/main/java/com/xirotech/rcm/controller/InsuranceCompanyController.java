package com.xirotech.rcm.controller;

import com.xirotech.rcm.dto.CompanyRequest;
import com.xirotech.rcm.model.InsuranceCompany;
import com.xirotech.rcm.service.InsuranceCompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/insurance-companies")
@RequiredArgsConstructor
public class InsuranceCompanyController {

    private final InsuranceCompanyService insuranceCompanyService;

    @GetMapping
    @PreAuthorize("hasRole('RCM_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllCompanies() {
        return ResponseEntity.ok(insuranceCompanyService.getAllCompaniesWithStats());
    }

    @GetMapping("/public")
    public ResponseEntity<List<Map<String, String>>> getPublicCompanies() {
        return ResponseEntity.ok(insuranceCompanyService.getPublicCompaniesList());
    }

    @PostMapping
    @PreAuthorize("hasRole('RCM_ADMIN')")
    public ResponseEntity<InsuranceCompany> createCompany(@Valid @RequestBody CompanyRequest request) {
        return new ResponseEntity<>(insuranceCompanyService.createCompany(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('RCM_ADMIN')")
    public ResponseEntity<InsuranceCompany> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "ACTIVE");
        return ResponseEntity.ok(insuranceCompanyService.updateStatus(id, status));
    }
}
