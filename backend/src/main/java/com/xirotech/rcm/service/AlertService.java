package com.xirotech.rcm.service;

import com.xirotech.rcm.model.Alert;
import com.xirotech.rcm.repository.AlertRepository;
import com.xirotech.rcm.websocket.LiveUpdateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final LiveUpdateService liveUpdateService;

    public List<Alert> getAllAlerts() {
        return alertRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Alert> getActiveAlerts() {
        return alertRepository.findByResolvedFalseOrderByCreatedAtDesc();
    }

    public Alert createAlert(String claimId, String type, String severity, String title, String message) {
        String alertId = "ALT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Alert alert = Alert.builder()
                .alertId(alertId)
                .claimId(claimId)
                .type(type)
                .severity(severity)
                .title(title)
                .message(message)
                .resolved(false)
                .createdAt(Instant.now())
                .build();

        Alert saved = alertRepository.save(alert);
        liveUpdateService.broadcastUpdate("ALERT_CREATED", saved);
        return saved;
    }

    public Alert resolveAlert(String id) {
        Alert alert = alertRepository.findById(id)
                .or(() -> alertRepository.findAll().stream().filter(a -> id.equalsIgnoreCase(a.getAlertId())).findFirst())
                .orElseThrow(() -> new IllegalArgumentException("Alert not found with id: " + id));
        alert.setResolved(true);
        Alert updated = alertRepository.save(alert);
        liveUpdateService.broadcastUpdate("ALERT_RESOLVED", updated);
        return updated;
    }

    public int resolveAllAlerts() {
        List<Alert> activeAlerts = alertRepository.findByResolvedFalseOrderByCreatedAtDesc();
        for (Alert a : activeAlerts) {
            a.setResolved(true);
        }
        alertRepository.saveAll(activeAlerts);
        liveUpdateService.broadcastUpdate("ALERTS_ALL_RESOLVED", null);
        return activeAlerts.size();
    }
}
