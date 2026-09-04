package com.xirotech.rcm.repository;

import com.xirotech.rcm.model.ClaimEmailNotification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimEmailNotificationRepository extends MongoRepository<ClaimEmailNotification, String> {
    List<ClaimEmailNotification> findByClaimIdOrderBySentAtDesc(String claimId);
    List<ClaimEmailNotification> findByPatientEmailOrderBySentAtDesc(String patientEmail);
    List<ClaimEmailNotification> findTop50ByOrderBySentAtDesc();
}
