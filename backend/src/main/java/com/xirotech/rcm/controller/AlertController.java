package com.xirotech.rcm.controller;

import com.xirotech.rcm.model.Alert;
import com.xirotech.rcm.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<List<Alert>> getAllAlerts() {
        return ResponseEntity.ok(alertService.getAllAlerts());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Alert>> getActiveAlerts() {
        return ResponseEntity.ok(alertService.getActiveAlerts());
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Alert> resolveAlert(@PathVariable String id) {
        return ResponseEntity.ok(alertService.resolveAlert(id));
    }

    @PutMapping("/resolve-all")
    public ResponseEntity<Map<String, Object>> resolveAllAlerts() {
        int count = alertService.resolveAllAlerts();
        return ResponseEntity.ok(Map.of("message", "All active alerts marked as read and moved to history", "count", count));
    }
}
