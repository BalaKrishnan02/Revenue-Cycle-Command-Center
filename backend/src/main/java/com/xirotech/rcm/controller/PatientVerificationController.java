package com.xirotech.rcm.controller;

import com.xirotech.rcm.dto.PatientOtpRequest;
import com.xirotech.rcm.dto.PatientVerifyOtpRequest;
import com.xirotech.rcm.service.PatientVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/patient-verification")
@RequiredArgsConstructor
public class PatientVerificationController {

    private final PatientVerificationService verificationService;

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@Valid @RequestBody PatientOtpRequest request) {
        return ResponseEntity.ok(verificationService.sendOtp(request.getPatientId(), request.getEmail()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@Valid @RequestBody PatientVerifyOtpRequest request) {
        return ResponseEntity.ok(verificationService.verifyOtp(request.getPatientId(), request.getEmail(), request.getOtp()));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(
            @RequestParam String patientId,
            @RequestParam String email) {
        return ResponseEntity.ok(verificationService.getVerificationStatus(patientId, email));
    }

    @PostMapping("/clear")
    public ResponseEntity<Map<String, String>> clearVerification(@RequestBody Map<String, String> body) {
        String patientId = body.get("patientId");
        verificationService.clearVerification(patientId);
        return ResponseEntity.ok(Map.of("message", "Verification state cleared for " + patientId));
    }
}
