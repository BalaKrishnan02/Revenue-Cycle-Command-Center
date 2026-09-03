package com.xirotech.rcm.service;

import com.xirotech.rcm.model.Claim;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Slf4j
@Service
public class PayerSimulationService {

    private final Random random = new Random();

    public Map<String, String> evaluateClaimSubmission(Claim claim) {
        Map<String, String> result = new HashMap<>();

        // Deterministic simulation logic based on claim quality:
        if (!claim.isEligibilityVerified()) {
            result.put("status", "DENIED");
            result.put("reason", "Eligibility Issue: Patient coverage inactive or not verified with payer network");
            return result;
        }

        if (!claim.isAuthorizationAvailable()) {
            result.put("status", "DENIED");
            result.put("reason", "Missing Prior Authorization: Required pre-approval missing for billed CPT procedure");
            return result;
        }

        if (!claim.isCodingComplete()) {
            result.put("status", "DENIED");
            result.put("reason", "Coding Error: ICD-10 and CPT code mismatch or incomplete billing qualifiers");
            return result;
        }

        if (!claim.isDocumentationComplete()) {
            result.put("status", "DENIED");
            result.put("reason", "Incomplete Documentation: Operative report and medical necessity notes missing");
            return result;
        }

        if (claim.getPreviousDenials() >= 4) {
            result.put("status", "DENIED");
            result.put("reason", "Payer Rule Issue: Maximum submission threshold exceeded for repeat denial");
            return result;
        }

        // When all quality metrics pass: 95% chance ACCEPTED, 5% PENDING
        int roll = random.nextInt(100);
        if (roll < 95) {
            result.put("status", "ACCEPTED");
            result.put("reason", null);
        } else {
            result.put("status", "PENDING");
            result.put("reason", "In Process: Payer adjudicating complex multi-line service");
        }

        return result;
    }
}
