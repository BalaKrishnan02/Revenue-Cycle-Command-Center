package com.xirotech.rcm.service;

import com.xirotech.rcm.dto.AuthResponse;
import com.xirotech.rcm.dto.LoginRequest;
import com.xirotech.rcm.dto.RegisterRequest;
import com.xirotech.rcm.exception.ResourceNotFoundException;
import com.xirotech.rcm.model.InsuranceCompany;
import com.xirotech.rcm.model.User;
import com.xirotech.rcm.repository.InsuranceCompanyRepository;
import com.xirotech.rcm.repository.UserRepository;
import com.xirotech.rcm.security.JwtTokenProvider;
import com.xirotech.rcm.security.SecurityUtils;
import com.xirotech.rcm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final InsuranceCompanyRepository insuranceCompanyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AlertService alertService;

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with email " + email + " already exists.");
        }

        boolean isAdmin = "RCM_ADMIN".equalsIgnoreCase(request.getRegistrationType());
        String role = isAdmin ? "RCM_ADMIN" : "INSURANCE_COMPANY";

        // Admin accounts are immediately ACTIVE; Insurance company accounts can be ACTIVE or PENDING_APPROVAL
        String accountStatus = isAdmin ? "ACTIVE" : "ACTIVE"; 

        String companyId = null;
        String companyName = null;

        if (!isAdmin) {
            // Find company by companyId, or companyCode
            if (request.getCompanyId() != null && !request.getCompanyId().isBlank()) {
                Optional<InsuranceCompany> companyOpt = insuranceCompanyRepository.findById(request.getCompanyId())
                        .or(() -> insuranceCompanyRepository.findByCompanyCode(request.getCompanyId()));
                if (companyOpt.isPresent()) {
                    companyId = companyOpt.get().getId();
                    companyName = companyOpt.get().getCompanyName();
                }
            } else if (request.getCompanyCode() != null && !request.getCompanyCode().isBlank()) {
                Optional<InsuranceCompany> companyOpt = insuranceCompanyRepository.findByCompanyCode(request.getCompanyCode());
                if (companyOpt.isPresent()) {
                    companyId = companyOpt.get().getId();
                    companyName = companyOpt.get().getCompanyName();
                }
            }

            if (companyId == null && request.getCompanyName() != null && !request.getCompanyName().isBlank()) {
                // Fallback: match by company name or assign default
                companyName = request.getCompanyName().trim();
                companyId = "INS" + String.format("%03d", insuranceCompanyRepository.count() + 1);
            }

            if (companyId == null) {
                companyId = "INS001";
                companyName = "Nova Health Insurance";
            }
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .fullName(isAdmin ? request.getFullName() : (request.getContactPerson() != null ? request.getContactPerson() : companyName + " User"))
                .contactPerson(!isAdmin ? request.getContactPerson() : null)
                .organizationName(isAdmin ? request.getOrganizationName() : null)
                .insuranceCompanyId(companyId)
                .insuranceCompanyName(companyName)
                .accountStatus(accountStatus)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        User saved = userRepository.save(user);
        log.info("Registered new user: email={}, role={}, companyId={}", saved.getEmail(), saved.getRole(), saved.getInsuranceCompanyId());

        // Notify RCM admin of new user registration
        if (!isAdmin) {
            alertService.createAlert(
                    null,
                    "USER_REGISTRATION",
                    "INFO",
                    "New Insurance Company Registered: " + companyName,
                    "User " + saved.getFullName() + " (" + saved.getEmail() + ") registered for " + companyName + "."
            );
        }

        UserPrincipal principal = UserPrincipal.create(saved);
        String token = jwtTokenProvider.generateToken(principal);

        return AuthResponse.builder()
                .token(token)
                .userId(saved.getId())
                .name(saved.getFullName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .companyId(saved.getInsuranceCompanyId())
                .companyName(saved.getInsuranceCompanyName())
                .accountStatus(saved.getAccountStatus())
                .message("Account registered successfully.")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        if ("SUSPENDED".equalsIgnoreCase(user.getAccountStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account has been suspended by the administrator.");
        }

        if ("PENDING_APPROVAL".equalsIgnoreCase(user.getAccountStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is pending approval by the RCM Administrator.");
        }

        UserPrincipal principal = UserPrincipal.create(user);
        String token = jwtTokenProvider.generateToken(principal);

        log.info("User logged in successfully: email={}, role={}, companyId={}", user.getEmail(), user.getRole(), user.getInsuranceCompanyId());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .companyId(user.getInsuranceCompanyId())
                .companyName(user.getInsuranceCompanyName())
                .accountStatus(user.getAccountStatus())
                .message("Login successful.")
                .build();
    }

    public AuthResponse getCurrentUser() {
        UserPrincipal principal = SecurityUtils.getCurrentUser();
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + principal.getId()));

        return AuthResponse.builder()
                .userId(user.getId())
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .companyId(user.getInsuranceCompanyId())
                .companyName(user.getInsuranceCompanyName())
                .accountStatus(user.getAccountStatus())
                .build();
    }
}
