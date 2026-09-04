package com.xirotech.rcm.repository;

import com.xirotech.rcm.model.InsuranceCompany;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InsuranceCompanyRepository extends MongoRepository<InsuranceCompany, String> {
    Optional<InsuranceCompany> findByCompanyCode(String companyCode);
    boolean existsByCompanyCode(String companyCode);
    List<InsuranceCompany> findByStatus(String status);
    List<InsuranceCompany> findAllByOrderByCompanyNameAsc();
}
