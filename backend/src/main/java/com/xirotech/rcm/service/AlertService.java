package com.xirotech.rcm.service;

import com.xirotech.rcm.model.Alert;
import com.xirotech.rcm.model.Claim;
import com.xirotech.rcm.repository.AlertRepository;
import com.xirotech.rcm.repository.ClaimRepository;
import com.xirotech.rcm.security.SecurityUtils;
import com.xirotech.rcm.websocket.LiveUpdateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final ClaimRepository claimRepository;
    private final LiveUpdateService liveUpdateService;

    public List<Alert> getAllAlerts(String filterCompanyId) {
        if (SecurityUtils.isInsuranceCompany()) {
            String companyId = SecurityUtils.getCurrentCompanyId();
            log.info("Enforcing alert data isolation: fetching alerts exclusively for companyId={}", companyId);
            return alertRepository.findByInsuranceCompanyIdOrderByCreatedAtDesc(companyId);
        }

        if (filterCompanyId != null && !filterCompanyId.isBlank() && !"ALL".equalsIgnoreCase(filterCompanyId)) {
            return alertRepository.findByInsuranceCompanyIdOrderByCreatedAtDesc(filterCompanyId);
        }

        return alertRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Alert> getActiveAlerts(String filterCompanyId) {
        if (SecurityUtils.isInsuranceCompany()) {
            String companyId = SecurityUtils.getCurrentCompanyId();
            return alertRepository.findByInsuranceCompanyIdAndResolvedFalseOrderByCreatedAtDesc(companyId);
        }

        if (filterCompanyId != null && !filterCompanyId.isBlank() && !"ALL".equalsIgnoreCase(filterCompanyId)) {
            return alertRepository.findByInsuranceCompanyIdAndResolvedFalseOrderByCreatedAtDesc(filterCompanyId);
        }

        return alertRepository.findByResolvedFalseOrderByCreatedAtDesc();
    }

    public Alert createAlert(String claimId, String type, String severity, String title, String message) {
        return createAlert(claimId, null, null, type, severity, title, message);
    }

    public Alert createAlert(String claimId, String companyId, String companyName, String type, String severity, String title, String message) {
        // Auto-resolve company from claim if not supplied
        if ((companyId == null || companyName == null) && claimId != null) {
            Optional<Claim> claimOpt = claimRepository.findFirstByClaimId(claimId)
                    .or(() -> claimRepository.findById(claimId));
            if (claimOpt.isPresent()) {
                Claim c = claimOpt.get();
                if (companyId == null) companyId = c.getInsuranceCompanyId();
                if (companyName == null) {
                    companyName = c.getInsuranceCompanyName() != null ? c.getInsuranceCompanyName() : c.getPayerName();
                }
            }
        }

        String alertId = "ALT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Alert alert = Alert.builder()
                .alertId(alertId)
                .claimId(claimId)
                .insuranceCompanyId(companyId)
                .insuranceCompanyName(companyName)
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alert not found with id: " + id));

        // Company isolation check on resolving alerts
        if (SecurityUtils.isInsuranceCompany()) {
            String companyId = SecurityUtils.getCurrentCompanyId();
            if (alert.getInsuranceCompanyId() != null && !alert.getInsuranceCompanyId().equalsIgnoreCase(companyId)) {
                log.warn("Security Alert: Insurer {} attempted to resolve alert {} belonging to {}",
                        companyId, id, alert.getInsuranceCompanyId());
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Access Denied: You cannot modify alerts belonging to another insurance company.");
            }
        }

        alert.setResolved(true);
        Alert updated = alertRepository.save(alert);
        liveUpdateService.broadcastUpdate("ALERT_RESOLVED", updated);
        return updated;
    }

    public int resolveAllAlerts() {
        List<Alert> activeAlerts;
        if (SecurityUtils.isInsuranceCompany()) {
            String companyId = SecurityUtils.getCurrentCompanyId();
            activeAlerts = alertRepository.findByInsuranceCompanyIdAndResolvedFalseOrderByCreatedAtDesc(companyId);
        } else {
            activeAlerts = alertRepository.findByResolvedFalseOrderByCreatedAtDesc();
        }

        for (Alert a : activeAlerts) {
            a.setResolved(true);
        }
        alertRepository.saveAll(activeAlerts);
        liveUpdateService.broadcastUpdate("ALERTS_ALL_RESOLVED", null);
        return activeAlerts.size();
    }
}
