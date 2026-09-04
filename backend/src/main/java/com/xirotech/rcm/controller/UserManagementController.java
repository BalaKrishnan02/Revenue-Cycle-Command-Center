package com.xirotech.rcm.controller;

import com.xirotech.rcm.exception.ResourceNotFoundException;
import com.xirotech.rcm.model.User;
import com.xirotech.rcm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RCM_ADMIN')")
public class UserManagementController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAllByOrderByCreatedAtDesc());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<User> approveUser(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        user.setAccountStatus("ACTIVE");
        user.setActive(true);
        user.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<User> rejectUser(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        user.setAccountStatus("SUSPENDED");
        user.setActive(false);
        user.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/{id}/disable")
    public ResponseEntity<User> disableUser(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        user.setAccountStatus("SUSPENDED");
        user.setActive(false);
        user.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(userRepository.save(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully", "userId", id));
    }
}
