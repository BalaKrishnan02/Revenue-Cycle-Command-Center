package com.xirotech.rcm.controller;

import com.xirotech.rcm.dto.PaymentRequest;
import com.xirotech.rcm.model.Payment;
import com.xirotech.rcm.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @PostMapping("/{claimId}")
    public ResponseEntity<Payment> processPayment(@PathVariable String claimId, @RequestBody(required = false) PaymentRequest request) {
        return ResponseEntity.ok(paymentService.processPayment(claimId, request));
    }
}
