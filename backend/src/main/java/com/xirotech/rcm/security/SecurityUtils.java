package com.xirotech.rcm.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            return (UserPrincipal) auth.getPrincipal();
        }
        return null;
    }

    public static String getCurrentUserRole() {
        UserPrincipal user = getCurrentUser();
        return user != null ? user.getRole() : null;
    }

    public static String getCurrentCompanyId() {
        UserPrincipal user = getCurrentUser();
        return user != null ? user.getCompanyId() : null;
    }

    public static String getCurrentCompanyName() {
        UserPrincipal user = getCurrentUser();
        return user != null ? user.getCompanyName() : null;
    }

    public static boolean isRcmAdmin() {
        UserPrincipal user = getCurrentUser();
        return user != null && "RCM_ADMIN".equalsIgnoreCase(user.getRole());
    }

    public static boolean isInsuranceCompany() {
        UserPrincipal user = getCurrentUser();
        return user != null && "INSURANCE_COMPANY".equalsIgnoreCase(user.getRole());
    }
}
