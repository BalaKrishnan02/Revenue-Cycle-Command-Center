package com.xirotech.rcm.service;

import com.xirotech.rcm.dto.CompanyRequest;
import com.xirotech.rcm.exception.ResourceNotFoundException;
import com.xirotech.rcm.model.Claim;
import com.xirotech.rcm.model.InsuranceCompany;
import com.xirotech.rcm.model.User;
import com.xirotech.rcm.repository.ClaimRepository;
import com.xirotech.rcm.repository.InsuranceCompanyRepository;
import com.xirotech.rcm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InsuranceCompanyService {

    private final InsuranceCompanyRepository insuranceCompanyRepository;
    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;

    public List<Map<String, Object>> getAllCompaniesWithStats() {
        List<InsuranceCompany> companies = insuranceCompanyRepository.findAllByOrderByCompanyNameAsc();
        List<Claim> allClaims = claimRepository.findAll();
        List<User> allUsers = userRepository.findAll();

        List<Map<String, Object>> result = new ArrayList<>();

        for (InsuranceCompany comp : companies) {
            String cId = comp.getId();

            List<Claim> compClaims = allClaims.stream()
                    .filter(c -> cId.equalsIgnoreCase(c.getInsuranceCompanyId()) ||
                            (c.getPayerName() != null && c.getPayerName().equalsIgnoreCase(comp.getCompanyName())))
                    .toList();

            long activeUsers = allUsers.stream()
                    .filter(u -> cId.equalsIgnoreCase(u.getInsuranceCompanyId()) && u.isActive())
                    .count();

            double pendingAmount = compClaims.stream()
                    .filter(c -> !"PAID".equalsIgnoreCase(c.getStatus()) && !"PAID/CLOSED".equalsIgnoreCase(c.getAgingBucket()))
                    .mapToDouble(c -> c.getPendingAmount() > 0 ? c.getPendingAmount() : Math.max(0, c.getTotalBillAmount() - c.getPaidAmount()))
                    .sum();

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", comp.getId());
            map.put("companyId", comp.getId());
            map.put("companyCode", comp.getCompanyCode());
            map.put("companyName", comp.getCompanyName());
            map.put("contactPerson", comp.getContactPerson() != null ? comp.getContactPerson() : "Authorized Agent");
            map.put("email", comp.getEmail() != null ? comp.getEmail() : comp.getCompanyCode().toLowerCase() + "@insurance.com");
            map.put("status", comp.getStatus() != null ? comp.getStatus() : "ACTIVE");
            map.put("claimsCount", compClaims.size());
            map.put("totalClaims", compClaims.size());
            map.put("pendingClaims", compClaims.stream().filter(c -> "PENDING".equalsIgnoreCase(c.getStatus()) || "SUBMITTED".equalsIgnoreCase(c.getStatus()) || "UNDER_REVIEW".equalsIgnoreCase(c.getStatus())).count());
            map.put("pendingAmount", pendingAmount);
            map.put("totalAmount", pendingAmount);
            map.put("activeUsers", activeUsers);
            map.put("activeUsersCount", activeUsers);
            map.put("createdAt", comp.getCreatedAt());

            result.add(map);
        }

        return result;
    }

    public List<Map<String, String>> getPublicCompaniesList() {
        return insuranceCompanyRepository.findAllByOrderByCompanyNameAsc().stream()
                .filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus()))
                .map(c -> {
                    Map<String, String> m = new HashMap<>();
                    m.put("companyId", c.getId());
                    m.put("companyCode", c.getCompanyCode());
                    m.put("companyName", c.getCompanyName());
                    return m;
                })
                .collect(Collectors.toList());
    }

    public InsuranceCompany createCompany(CompanyRequest request) {
        String code = request.getCompanyCode().trim().toUpperCase();

        if (insuranceCompanyRepository.existsByCompanyCode(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A company with code " + code + " already exists.");
        }

        String companyId = "INS" + String.format("%03d", insuranceCompanyRepository.count() + 1);

        InsuranceCompany company = InsuranceCompany.builder()
                .id(companyId)
                .companyCode(code)
                .companyName(request.getCompanyName().trim())
                .contactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : "")
                .email(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "")
                .status(request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return insuranceCompanyRepository.save(company);
    }

    public InsuranceCompany updateStatus(String companyId, String status) {
        InsuranceCompany company = insuranceCompanyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Insurance company not found: " + companyId));

        company.setStatus(status.trim().toUpperCase());
        company.setUpdatedAt(Instant.now());
        return insuranceCompanyRepository.save(company);
    }
}
