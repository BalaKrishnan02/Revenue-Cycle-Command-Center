package com.xirotech.rcm.security;

import com.xirotech.rcm.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Data
@Builder
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private String id;
    private String email;
    private String password;
    private String name;
    private String role; // RCM_ADMIN or INSURANCE_COMPANY
    private String companyId;
    private String companyName;
    private String accountStatus;
    private boolean active;
    private Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(User user) {
        String roleWithPrefix = user.getRole().startsWith("ROLE_") ? user.getRole() : "ROLE_" + user.getRole();
        Collection<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(roleWithPrefix));

        return UserPrincipal.builder()
                .id(user.getId())
                .email(user.getEmail())
                .password(user.getPasswordHash())
                .name(user.getFullName() != null ? user.getFullName() : user.getContactPerson())
                .role(user.getRole())
                .companyId(user.getInsuranceCompanyId())
                .companyName(user.getInsuranceCompanyName())
                .accountStatus(user.getAccountStatus())
                .active(user.isActive() && !"SUSPENDED".equalsIgnoreCase(user.getAccountStatus()))
                .authorities(authorities)
                .build();
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !"SUSPENDED".equalsIgnoreCase(accountStatus);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active && "ACTIVE".equalsIgnoreCase(accountStatus);
    }
}
