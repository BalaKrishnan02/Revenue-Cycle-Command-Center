package com.xirotech.rcm.repository;

import com.xirotech.rcm.model.Claim;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimRepository extends MongoRepository<Claim, String> {
    Optional<Claim> findByClaimId(String claimId);
    Optional<Claim> findFirstByClaimId(String claimId);
    List<Claim> findByStatus(String status);
    List<Claim> findByRiskLevel(String riskLevel);
    List<Claim> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
    long countByRiskLevel(String riskLevel);

    // Company-specific queries for strict data isolation
    List<Claim> findByInsuranceCompanyIdOrderByCreatedAtDesc(String insuranceCompanyId);
    List<Claim> findByInsuranceCompanyIdAndStatus(String insuranceCompanyId, String status);
    List<Claim> findByInsuranceCompanyId(String insuranceCompanyId);
    long countByInsuranceCompanyId(String insuranceCompanyId);
    long countByInsuranceCompanyIdAndStatus(String insuranceCompanyId, String status);
}
