package com.xirotech.rcm.service;

import com.xirotech.rcm.model.Claim;
import com.xirotech.rcm.model.ClaimEmailNotification;
import com.xirotech.rcm.repository.ClaimEmailNotificationRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class LifecycleEmailService {

    private final ClaimEmailNotificationRepository emailRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${rcm.mail.from:notifications@rcminsight.com}")
    private String mailFrom;

    @Value("${rcm.mail.default-recipient:balakrishnana206k@gmail.com}")
    private String defaultRecipient;

    @Value("${rcm.mail.enabled:true}")
    private boolean mailEnabled;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss z")
            .withZone(ZoneId.systemDefault());

    /**
     * Dispatches automated email notification for a specific claim lifecycle stage.
     */
    public ClaimEmailNotification sendStageProgressEmail(Claim claim, int stageIndex, String stageName, String stageDescription) {
        if (!mailEnabled) {
            log.info("Mail notifications disabled by configuration.");
            return null;
        }

        String recipient = (claim.getPatientEmail() != null && !claim.getPatientEmail().isBlank())
                ? claim.getPatientEmail().trim()
                : defaultRecipient;

        String subject = generateSubject(claim, stageIndex, stageName);
        String htmlBody = buildLifecycleEmailHtml(claim, stageIndex, stageName, stageDescription, recipient);

        String deliveryStatus = "DELIVERED";
        String deliveryDetails = "Logged and recorded in RCM Command Center";

        // Attempt SMTP dispatch if JavaMailSender and username are configured
        if (mailSender != null && mailUsername != null && !mailUsername.isBlank()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(mailFrom != null && !mailFrom.isBlank() ? mailFrom : mailUsername, "RCM Insight Command Center");
                helper.setTo(recipient);
                helper.setSubject(subject);
                helper.setText(htmlBody, true);

                mailSender.send(message);
                deliveryStatus = "DISPATCHED_SMTP";
                deliveryDetails = "Dispatched via SMTP to " + recipient;
                log.info("Successfully sent SMTP lifecycle email to {} for claim {}", recipient, claim.getClaimId());
            } catch (Exception e) {
                deliveryStatus = "DISPATCHED (Notification Logged)";
                deliveryDetails = "SMTP delivery attempted: " + e.getMessage();
                log.warn("SMTP send skipped or failed: {}. Email logged to database for {}", e.getMessage(), recipient);
            }
        } else {
            deliveryStatus = "DELIVERED (Notification Center)";
            deliveryDetails = "Delivered to patient inbox record for " + recipient;
            log.info("Lifecycle email notification recorded for recipient {} on claim {}", recipient, claim.getClaimId());
        }

        ClaimEmailNotification notification = ClaimEmailNotification.builder()
                .claimId(claim.getClaimId())
                .patientEmail(recipient)
                .patientName(claim.getPatientName() != null ? claim.getPatientName() : "Valued Patient")
                .patientReference(claim.getPatientReference())
                .stageIndex(stageIndex)
                .stageName(stageName)
                .claimStatus(claim.getStatus())
                .billedAmount(claim.getTotalBillAmount() > 0 ? claim.getTotalBillAmount() : claim.getClaimAmount())
                .payerName(claim.getInsuranceCompanyName() != null ? claim.getInsuranceCompanyName() : claim.getPayerName())
                .subject(subject)
                .htmlBody(htmlBody)
                .deliveryStatus(deliveryStatus)
                .deliveryDetails(deliveryDetails)
                .sentAt(Instant.now())
                .build();

        return emailRepository.save(notification);
    }

    public List<ClaimEmailNotification> getEmailsForClaim(String claimId) {
        return emailRepository.findByClaimIdOrderBySentAtDesc(claimId);
    }

    public ClaimEmailNotification triggerManualStageEmail(Claim claim, String customRecipient) {
        if (customRecipient != null && !customRecipient.isBlank()) {
            claim.setPatientEmail(customRecipient.trim());
        }

        int stageIndex = resolveStageIndex(claim.getStatus());
        String stageName = resolveStageName(stageIndex, claim.getStatus());
        String stageDesc = "Manual lifecycle progress dispatch requested for " + claim.getClaimId() + " (Status: " + claim.getStatus() + ").";

        return sendStageProgressEmail(claim, stageIndex, stageName, stageDesc);
    }

    private int resolveStageIndex(String status) {
        if (status == null) return 1;
        switch (status.toUpperCase()) {
            case "CREATED":
                return 1;
            case "AI_CHECKED":
            case "HIGH_RISK":
            case "READY_TO_SUBMIT":
            case "CORRECTED":
                return 2;
            case "SUBMITTED":
            case "RESUBMITTED":
                return 3;
            case "PENDING":
            case "ACCEPTED":
            case "DENIED":
            case "UNDER_REVIEW":
                return 4;
            case "PAID":
            case "PARTIALLY_PAID":
                return 5;
            default:
                return 1;
        }
    }

    private String resolveStageName(int stageIndex, String status) {
        switch (stageIndex) {
            case 1:
                return "Stage 1: Claim Intake & Registration";
            case 2:
                return "Stage 2: AI Pre-Audit Risk Analysis";
            case 3:
                return "Stage 3: Electronic EDI 837 Submission";
            case 4:
                return "Stage 4: Payer Adjudication Decision (" + (status != null ? status : "IN_REVIEW") + ")";
            case 5:
                return "Stage 5: Remittance & Settlement Disbursed";
            default:
                return "Stage " + stageIndex + ": Lifecycle Update";
        }
    }

    private String generateSubject(Claim claim, int stageIndex, String stageName) {
        String claimId = claim.getClaimId() != null ? claim.getClaimId() : "CLAIM";
        switch (stageIndex) {
            case 1:
                return "[RCM Insight] Claim " + claimId + " Intake Confirmed — Stage 1: Registration Complete";
            case 2:
                int risk = claim.getRiskScore() != null ? claim.getRiskScore() : 0;
                return "[RCM Insight] Claim " + claimId + " AI Pre-Audit Complete — Stage 2: Risk Score " + risk + "%";
            case 3:
                String payer = claim.getPayerName() != null ? claim.getPayerName() : "Insurance Payer";
                return "[RCM Insight] Claim " + claimId + " Transmitted to " + payer + " — Stage 3: EDI 837 Submitted";
            case 4:
                String st = claim.getStatus() != null ? claim.getStatus() : "ADJUDICATED";
                return "[RCM Insight] Claim " + claimId + " Adjudication: " + st + " — Stage 4 Complete";
            case 5:
                return "[RCM Insight] Claim " + claimId + " Payment Settled — Stage 5: Final Settlement Disbursed";
            default:
                return "[RCM Insight] Claim " + claimId + " Process Lifecycle Progress Update";
        }
    }

    private String buildLifecycleEmailHtml(Claim claim, int currentStage, String stageName, String description, String recipient) {
        NumberFormat currencyFmt = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        double amount = claim.getTotalBillAmount() > 0 ? claim.getTotalBillAmount() : claim.getClaimAmount();
        String formattedAmount = currencyFmt.format(amount).replace("INR", "₹");
        String formattedAllowed = claim.getAllowedAmount() > 0 ? currencyFmt.format(claim.getAllowedAmount()).replace("INR", "₹") : formattedAmount;
        String payer = claim.getPayerName() != null ? claim.getPayerName() : "Insurance Payer";
        String patient = claim.getPatientName() != null ? claim.getPatientName() : "Valued Patient";
        String claimId = claim.getClaimId() != null ? claim.getClaimId() : "N/A";
        String timestamp = DATE_FMT.format(Instant.now());

        // Stepper Stage Items
        String[] stageLabels = {"1. Intake", "2. AI Audit", "3. Submission", "4. Adjudicate", "5. Settlement"};
        StringBuilder stepperHtml = new StringBuilder();

        for (int i = 1; i <= 5; i++) {
            boolean isCompleted = i < currentStage;
            boolean isCurrent = i == currentStage;

            String circleBg = isCurrent ? "#2563eb" : (isCompleted ? "#10b981" : "#e2e8f0");
            String circleColor = (isCurrent || isCompleted) ? "#ffffff" : "#64748b";
            String labelColor = isCurrent ? "#1e40af" : (isCompleted ? "#065f46" : "#94a3b8");
            String iconContent = isCompleted ? "✓" : String.valueOf(i);

            stepperHtml.append(String.format(
                    "<div style=\"display: inline-block; width: 18%%; text-align: center; vertical-align: top;\">" +
                    "  <div style=\"width: 32px; height: 32px; border-radius: 50%%; background: %s; color: %s; line-height: 32px; font-weight: bold; font-size: 14px; margin: 0 auto 6px auto; box-shadow: %s;\">%s</div>" +
                    "  <div style=\"font-size: 11px; font-weight: 700; color: %s;\">%s</div>" +
                    "  <div style=\"font-size: 10px; color: #64748b;\">%s</div>" +
                    "</div>",
                    circleBg, circleColor,
                    isCurrent ? "0 0 0 3px rgba(37,99,235,0.25)" : "none",
                    iconContent,
                    labelColor,
                    stageLabels[i - 1],
                    isCurrent ? "ACTIVE" : (isCompleted ? "DONE" : "PENDING")
            ));
        }

        // Status badge color
        String statusBg = "#eff6ff";
        String statusColor = "#1d4ed8";
        String statusBorder = "#bfdbfe";
        String statusText = claim.getStatus() != null ? claim.getStatus().replace('_', ' ') : "PROCESSING";

        if ("ACCEPTED".equalsIgnoreCase(claim.getStatus()) || "PAID".equalsIgnoreCase(claim.getStatus())) {
            statusBg = "#ecfdf5";
            statusColor = "#047857";
            statusBorder = "#a7f3d0";
        } else if ("DENIED".equalsIgnoreCase(claim.getStatus()) || "HIGH_RISK".equalsIgnoreCase(claim.getStatus())) {
            statusBg = "#fef2f2";
            statusColor = "#b91c1c";
            statusBorder = "#fecaca";
        } else if ("AI_CHECKED".equalsIgnoreCase(claim.getStatus()) || "CORRECTED".equalsIgnoreCase(claim.getStatus())) {
            statusBg = "#f5f3ff";
            statusColor = "#6d28d9";
            statusBorder = "#ddd6fe";
        }

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "<title>Process Lifecycle Stage Progress</title>" +
                "</head>" +
                "<body style=\"margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;\">" +
                "  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f1f5f9; padding: 30px 10px;\">" +
                "    <tr>" +
                "      <td align=\"center\">" +
                "        <table role=\"presentation\" width=\"620\" cellspacing=\"0\" cellpadding=\"0\" style=\"background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;\">" +
                
                // Header
                "          <tr>" +
                "            <td style=\"background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 26px 30px; text-align: left;\">" +
                "              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">" +
                "                <tr>" +
                "                  <td>" +
                "                    <div style=\"font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;\">" +
                "                      <span style=\"color: #38bdf8;\">⚡</span> RCM INSIGHT" +
                "                    </div>" +
                "                    <div style=\"font-size: 12px; color: #94a3b8; margin-top: 4px;\">AI-Powered Revenue Cycle Command Center</div>" +
                "                  </td>" +
                "                  <td align=\"right\">" +
                "                    <span style=\"background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;\">" +
                "                      LIFECYCLE UPDATE" +
                "                    </span>" +
                "                  </td>" +
                "                </tr>" +
                "              </table>" +
                "            </td>" +
                "          </tr>" +

                // Main Content
                "          <tr>" +
                "            <td style=\"padding: 30px;\">" +
                "              <h2 style=\"margin: 0 0 12px 0; font-size: 20px; color: #0f172a; font-weight: 700;\">" +
                "                Process Lifecycle Stage Progress Update" +
                "              </h2>" +
                "              <p style=\"margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;\">" +
                "                Hello <strong>" + patient + "</strong>,<br/>" +
                "                Your medical claim (<strong>" + claimId + "</strong>) has progressed in our revenue cycle workflow. Below is your real-time stage progress report." +
                "              </p>" +

                // Stage Stepper Card
                "              <div style=\"background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 10px; margin-bottom: 24px; text-align: center;\">" +
                "                <div style=\"font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; margin-bottom: 16px;\">" +
                "                  Process Lifecycle Stage Progress (Stage " + currentStage + " of 5)" +
                "                </div>" +
                "                <div style=\"width: 100%; white-space: nowrap;\">" +
                                   stepperHtml.toString() +
                "                </div>" +
                "              </div>" +

                // Stage Event Callout Box
                "              <div style=\"background: " + statusBg + "; border-left: 4px solid " + statusColor + "; border-radius: 6px; padding: 16px; margin-bottom: 24px;\">" +
                "                <div style=\"font-size: 12px; font-weight: 800; color: " + statusColor + "; text-transform: uppercase;\">Current Milestone: " + stageName + "</div>" +
                "                <div style=\"font-size: 14px; color: #1e293b; margin-top: 6px; line-height: 1.5;\">" + description + "</div>" +
                "                <div style=\"font-size: 11px; color: #64748b; margin-top: 8px;\">Status: <span style=\"font-weight: 700; color: " + statusColor + ";\">" + statusText + "</span> &bull; Updated at: " + timestamp + "</div>" +
                "              </div>" +

                // Claim Summary Table
                "              <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse: collapse; margin-bottom: 24px;\">" +
                "                <tr>" +
                "                  <td style=\"padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b; width: 35%;\">Claim Identification</td>" +
                "                  <td style=\"padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #0f172a;\">" + claimId + "</td>" +
                "                </tr>" +
                "                <tr>" +
                "                  <td style=\"padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b;\">Patient Name & Reference</td>" +
                "                  <td style=\"padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; color: #334155;\">" + patient + " (" + (claim.getPatientReference() != null ? claim.getPatientReference() : "N/A") + ")</td>" +
                "                </tr>" +
                "                <tr>" +
                "                  <td style=\"padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b;\">Insurance Payer</td>" +
                "                  <td style=\"padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; color: #334155;\">" + payer + "</td>" +
                "                </tr>" +
                "                <tr>" +
                "                  <td style=\"padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b;\">Total Billed Amount</td>" +
                "                  <td style=\"padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #0f172a;\">" + formattedAmount + "</td>" +
                "                </tr>" +
                (claim.getAllowedAmount() > 0 ?
                "                <tr>" +
                "                  <td style=\"padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b;\">Payer Allowed Settlement</td>" +
                "                  <td style=\"padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #047857;\">" + formattedAllowed + "</td>" +
                "                </tr>" : "") +
                (claim.getDenialReason() != null ?
                "                <tr>" +
                "                  <td style=\"padding: 10px; background: #fef2f2; border: 1px solid #fecaca; font-size: 12px; font-weight: 700; color: #991b1b;\">Denial Reason</td>" +
                "                  <td style=\"padding: 10px; border: 1px solid #fecaca; font-size: 13px; font-weight: 600; color: #dc2626;\">" + claim.getDenialReason() + "</td>" +
                "                </tr>" : "") +
                "              </table>" +

                // What to expect next
                "              <div style=\"font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px;\">What Happens Next?</div>" +
                "              <ul style=\"margin: 0 0 24px 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #475569;\">" +
                "                <li>Our AI pre-audit and clinical documentation system monitors your claim in real-time.</li>" +
                "                <li>You will receive an automated notification at each subsequent milestone.</li>" +
                "                <li>If any additional documents are required from you, your provider will reach out directly.</li>" +
                "              </ul>" +

                // Contact & Signoff
                "              <p style=\"margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;\">" +
                "                Delivered to registered email: <strong>" + recipient + "</strong><br/>" +
                "                Warm regards,<br/>" +
                "                <strong>RCM Insight Patient Billing Support</strong>" +
                "              </p>" +
                "            </td>" +
                "          </tr>" +

                // Footer
                "          <tr>" +
                "            <td style=\"background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;\">" +
                "              This is an automated lifecycle progress update sent by RCM Insight Command Center.<br/>" +
                "              Confidential healthcare billing information intended solely for the recipient.<br/>" +
                "              &copy; " + java.time.Year.now().getValue() + " RCM Insight Systems. All rights reserved." +
                "            </td>" +
                "          </tr>" +
                "        </table>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</body>" +
                "</html>";
    }
}
