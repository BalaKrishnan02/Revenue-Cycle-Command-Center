package com.xirotech.rcm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueAnalytics {
    private String period; // e.g. "Jan", "Feb", "Week 1", etc.
    private double billed;
    private double collected;
    private double pending;
    private double denied;
}
