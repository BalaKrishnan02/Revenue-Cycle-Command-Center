package com.xirotech.rcm.service;

import com.xirotech.rcm.repository.PatientVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientVerificationService {

    private final PatientVerificationRepository verificationRepository;
    private final LifecycleEmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generates and dispatches OTP strictly for a specific patientId and email.
     * No global or static sharing.
     */
    public Map<String, Object> sendOtp(String patientId, String email) {
        if (patientId == null || patientId.isBlank() || email == null || email.isBlank()) {
            throw new IllegalArgumentException("Patient ID and Email are required");
        }

        String sanitizedPatientId = patientId.trim();
        String sanitizedEmail = email.trim().toLowerCase();

        // Generate 6-digit OTP
        int code = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(code);
        Instant expiry = Instant.now().plus(10, ChronoUnit.MINUTES);

        // Find existing record for this exact patientId + email or create fresh
        PatientVerification record = verificationRepository
                .findByPatientIdAndEmail(sanitizedPatientId, sanitizedEmail)
                .orElse(PatientVerification.builder()
                        .patientId(sanitizedPatientId)
                        .email(sanitizedEmail)
                        .build());

        record.setOtp(otp);
        record.setOtpExpiry(expiry);
        record.setEmailVerified(false);
        record.setVerifiedAt(null);

        verificationRepository.save(record);

        // Attempt dispatch via email service
        boolean emailSent = emailService.sendVerificationOtpEmail(sanitizedEmail, sanitizedPatientId, otp);

        log.info("Generated OTP for patientId: {} and email: {} (Dispatched via SMTP: {})",
                sanitizedPatientId, sanitizedEmail, emailSent);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Verification OTP sent successfully to " + sanitizedEmail);
        response.put("patientId", sanitizedPatientId);
        response.put("email", sanitizedEmail);
        response.put("emailSent", emailSent);
        response.put("expiresAt", expiry.toString());
        // Included for dev/offline testing
        response.put("devOtp", otp);

        return response;
    }

    /**
     * Verifies OTP strictly validating patientId + email + otp + expiry.
     */
    public Map<String, Object> verifyOtp(String patientId, String email, String otp) {
        if (patientId == null || email == null || otp == null) {
            throw new IllegalArgumentException("Patient ID, email, and OTP are required");
        }

        String sanitizedPatientId = patientId.trim();
        String sanitizedEmail = email.trim().toLowerCase();
        String sanitizedOtp = otp.trim();

        Optional<PatientVerification> optRecord = verificationRepository
                .findByPatientIdAndEmail(sanitizedPatientId, sanitizedEmail);

        if (optRecord.isEmpty()) {
            return Map.of(
                    "verified", false,
                    "message", "No verification request found for patient " + sanitizedPatientId + " with email " + sanitizedEmail
            );
        }

        PatientVerification record = optRecord.get();

        if (record.getOtp() == null || !record.getOtp().equals(sanitizedOtp)) {
            return Map.of(
                    "verified", false,
                    "message", "Invalid verification code. Please enter the correct OTP."
            );
        }

        if (record.getOtpExpiry() == null || Instant.now().isAfter(record.getOtpExpiry())) {
            return Map.of(
                    "verified", false,
                    "message", "Verification code has expired. Please request a new OTP."
            );
        }

        // Mark verified and clear the single-use OTP
        record.setEmailVerified(true);
        record.setVerifiedAt(Instant.now());
        record.setOtp(null); // Consumed
        verificationRepository.save(record);

        log.info("Email verified successfully for patientId: {} and email: {}", sanitizedPatientId, sanitizedEmail);

        Map<String, Object> response = new HashMap<>();
        response.put("verified", true);
        response.put("patientId", sanitizedPatientId);
        response.put("email", sanitizedEmail);
        response.put("message", "Email successfully verified for patient " + sanitizedPatientId);
        response.put("verifiedAt", record.getVerifiedAt().toString());

        return response;
    }

    /**
     * Checks if a specific patientId and email has been verified.
     */
    public Map<String, Object> getVerificationStatus(String patientId, String email) {
        if (patientId == null || email == null) {
            return Map.of("emailVerified", false);
        }

        String sanitizedPatientId = patientId.trim();
        String sanitizedEmail = email.trim().toLowerCase();

        Optional<PatientVerification> opt = verificationRepository
                .findByPatientIdAndEmail(sanitizedPatientId, sanitizedEmail);

        if (opt.isPresent() && opt.get().isEmailVerified()) {
            return Map.of(
                    "emailVerified", true,
                    "patientId", sanitizedPatientId,
                    "email", sanitizedEmail,
                    "verifiedAt", opt.get().getVerifiedAt() != null ? opt.get().getVerifiedAt().toString() : ""
            );
        }

        return Map.of(
                "emailVerified", false,
                "patientId", sanitizedPatientId,
                "email", sanitizedEmail
        );
    }

    /**
     * Clears temporary verification state when registration completes or is reset.
     */
    public void clearVerification(String patientId) {
        if (patientId != null && !patientId.isBlank()) {
            verificationRepository.deleteByPatientId(patientId.trim());
            log.info("Cleared temporary verification state for patientId: {}", patientId);
        }
    }
}
