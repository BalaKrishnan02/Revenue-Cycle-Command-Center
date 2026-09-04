package com.xirotech.rcm.repository;

import com.xirotech.rcm.model.PatientVerification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientVerificationRepository extends MongoRepository<PatientVerification, String> {
    Optional<PatientVerification> findByPatientIdAndEmail(String patientId, String email);
    Optional<PatientVerification> findTopByPatientIdOrderByCreatedAtDesc(String patientId);
    void deleteByPatientId(String patientId);
}
