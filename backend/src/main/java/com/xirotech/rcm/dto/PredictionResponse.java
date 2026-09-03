package com.xirotech.rcm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResponse {
    private int riskScore;
    private String riskLevel;
    @Builder.Default
    private List<String> reasons = new ArrayList<>();
    @Builder.Default
    private List<String> recommendations = new ArrayList<>();
    private Double modelConfidence;
}
