package com.xirotech.rcm.service;

import com.xirotech.rcm.dto.PredictionRequest;
import com.xirotech.rcm.dto.PredictionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MlClientService {

    private final RestTemplate restTemplate;

    @Value("${ml.service.url:http://localhost:8000}")
    private String mlServiceUrl;

    public PredictionResponse predictRisk(PredictionRequest request) {
        try {
            String url = mlServiceUrl + "/predict";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PredictionRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<PredictionResponse> response = restTemplate.postForEntity(url, entity, PredictionResponse.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Received prediction from ML service: score={}", response.getBody().getRiskScore());
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("ML Service unavailable at {}. Using embedded fallback rule engine: {}", mlServiceUrl, e.getMessage());
        }

        return fallbackPrediction(request);
    }

    private PredictionResponse fallbackPrediction(PredictionRequest req) {
        int score = 15;
        List<String> reasons = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        if (!req.isEligibilityVerified()) {
            score += 35;
            reasons.add("Insurance Eligibility Not Verified");
            recommendations.add("Verify active insurance eligibility before submitting the claim.");
        }
        if (!req.isAuthorizationAvailable()) {
            score += 35;
            reasons.add("Missing Prior Authorization");
            recommendations.add("Obtain and attach the required authorization code before submission.");
        }
        if (!req.isCodingComplete()) {
            score += 20;
            reasons.add("Incomplete / Invalid Coding (ICD/CPT)");
            recommendations.add("Review diagnosis and procedure coding with certified medical coder before submission.");
        }
        if (!req.isDocumentationComplete()) {
            score += 15;
            reasons.add("Incomplete Clinical Documentation");
            recommendations.add("Complete the required supporting clinical documentation and provider notes.");
        }
        if (req.getPreviousDenials() >= 3) {
            score += 15;
            reasons.add("High Previous Denial History (>= 3 past denials)");
            recommendations.add("Perform an additional supervisor claim review before payer submission.");
        }

        score = Math.min(95, Math.max(12, score));
        if (req.isEligibilityVerified() && req.isAuthorizationAvailable() && req.isCodingComplete() && req.isDocumentationComplete()) {
            score = Math.min(score, 22);
            reasons.clear();
            reasons.add("Clean Claim Quality Metrics");
            recommendations.clear();
            recommendations.add("Claim passes pre-submission checks. Ready for immediate payer submission.");
        }

        String level;
        if (score >= 70) {
            level = "HIGH";
        } else if (score >= 40) {
            level = "MEDIUM";
        } else {
            level = "LOW";
        }

        return PredictionResponse.builder()
                .riskScore(score)
                .riskLevel(level)
                .reasons(reasons)
                .recommendations(recommendations)
                .modelConfidence(0.88)
                .build();
    }
}
