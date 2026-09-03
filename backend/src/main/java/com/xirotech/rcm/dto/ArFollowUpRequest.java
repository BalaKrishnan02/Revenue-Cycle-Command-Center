package com.xirotech.rcm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArFollowUpRequest {
    private String followUpStatus; // NOT_STARTED, CONTACTED, WAITING_FOR_PAYER, ESCALATED, RESOLVED
    private String followUpNote;
    private Instant nextFollowUpDate;
}
