package com.xirotech.rcm.repository;

import com.xirotech.rcm.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends MongoRepository<Payment, String> {
    Optional<Payment> findByPaymentId(String paymentId);
    Optional<Payment> findByClaimId(String claimId);
    List<Payment> findAllByOrderByCreatedAtDesc();
}
