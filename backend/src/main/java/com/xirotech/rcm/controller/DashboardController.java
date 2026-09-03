package com.xirotech.rcm.controller;

import com.xirotech.rcm.dto.DashboardMetrics;
import com.xirotech.rcm.dto.DenialAnalytics;
import com.xirotech.rcm.dto.PayerAnalytics;
import com.xirotech.rcm.dto.RevenueAnalytics;
import com.xirotech.rcm.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/api/dashboard/metrics")
    public ResponseEntity<DashboardMetrics> getMetrics() {
        return ResponseEntity.ok(dashboardService.getDashboardMetrics());
    }

    @GetMapping("/api/analytics/denials")
    public ResponseEntity<List<DenialAnalytics>> getDenialsAnalytics() {
        return ResponseEntity.ok(dashboardService.getDenialAnalytics());
    }

    @GetMapping("/api/analytics/payers")
    public ResponseEntity<List<PayerAnalytics>> getPayerAnalytics() {
        return ResponseEntity.ok(dashboardService.getPayerAnalytics());
    }

    @GetMapping("/api/analytics/revenue")
    public ResponseEntity<List<RevenueAnalytics>> getRevenueAnalytics() {
        return ResponseEntity.ok(dashboardService.getRevenueAnalytics());
    }
}
