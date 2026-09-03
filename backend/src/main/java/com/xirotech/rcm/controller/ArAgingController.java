package com.xirotech.rcm.controller;

import com.xirotech.rcm.dto.ArAgingSummaryResponse;
import com.xirotech.rcm.dto.ArFollowUpRequest;
import com.xirotech.rcm.model.Claim;
import com.xirotech.rcm.service.ArAgingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/ar-aging")
@RequiredArgsConstructor
public class ArAgingController {

    private final ArAgingService arAgingService;

    @GetMapping("/summary")
    public ResponseEntity<ArAgingSummaryResponse> getSummary() {
        return ResponseEntity.ok(arAgingService.getArAgingSummary());
    }

    @GetMapping("/claims")
    public ResponseEntity<List<Claim>> getClaims(@RequestParam(required = false) String bucket) {
        return ResponseEntity.ok(arAgingService.getArAgingClaims(bucket));
    }

    @PostMapping("/claims/{id}/follow-up")
    public ResponseEntity<Claim> recordFollowUp(
            @PathVariable String id,
            @RequestBody ArFollowUpRequest request) {
        return ResponseEntity.ok(arAgingService.recordFollowUp(id, request));
    }
}
