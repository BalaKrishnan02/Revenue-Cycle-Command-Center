package com.xirotech.rcm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DenialAnalytics {
    private String reason;
    private long count;
    private double totalAmount;
    private double percentage;
}
