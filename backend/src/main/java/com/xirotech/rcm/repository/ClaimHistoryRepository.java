package com.xirotech.rcm.repository;

import com.xirotech.rcm.model.ClaimHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimHistoryRepository extends MongoRepository<ClaimHistory, String> {
    List<ClaimHistory> findByClaimIdOrderByTimestampAsc(String claimId);
}
