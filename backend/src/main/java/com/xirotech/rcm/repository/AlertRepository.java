package com.xirotech.rcm.repository;

import com.xirotech.rcm.model.Alert;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends MongoRepository<Alert, String> {
    List<Alert> findByResolvedFalseOrderByCreatedAtDesc();
    List<Alert> findAllByOrderByCreatedAtDesc();
    List<Alert> findByClaimId(String claimId);
    List<Alert> findByInsuranceCompanyIdOrderByCreatedAtDesc(String insuranceCompanyId);
    List<Alert> findByInsuranceCompanyIdAndResolvedFalseOrderByCreatedAtDesc(String insuranceCompanyId);
}
