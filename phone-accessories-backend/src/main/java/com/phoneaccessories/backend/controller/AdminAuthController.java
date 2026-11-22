
package com.phoneaccessories.backend.controller;

import com.phoneaccessories.backend.entity.Admin;
import com.phoneaccessories.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminAuthController {

    @Autowired
    private AdminService adminService;

    // Check if owner is already created - setup is allowed only once
    @GetMapping("/check-setup")
    public ResponseEntity<?> checkSetup() {
        boolean exists = adminService.adminExists();
        Map<String, Object> res = new HashMap<>();
        res.put("exists", exists);
        res.put("setupCompleted", exists);
        res.put("isSetup", exists);
        res.put("message", exists ? "Owner already created" : "Owner not created yet");
        return ResponseEntity.ok(res);
    }

    // ONE-TIME OWNER SETUP - locked after first owner is created
    @PostMapping("/setup")
    public ResponseEntity<?> setup(@RequestBody Map<String, String> req) {
        try {
            Admin saved = adminService.setupAdmin(req.get("email"), req.get("recoveryEmail"), req.get("password"));
            return ResponseEntity.ok(Map.of(
                    "message", "Owner account created successfully",
                    "id", saved.getId(),
                    "email", saved.getEmail(),
                    "recoveryEmail", saved.getRecoveryEmail() != null ? saved.getRecoveryEmail() : ""
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // OWNER LOGIN - email + password
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        Optional<Admin> opt = adminService.loginAdmin(req.get("email"), req.get("password"));
        if (opt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
        }
        Admin a = opt.get();
        return ResponseEntity.ok(Map.of(
                "message", "Owner login successful",
                "id", a.getId(),
                "email", a.getEmail(),
                "recoveryEmail", a.getRecoveryEmail() != null ? a.getRecoveryEmail() : ""
        ));
    }

    // FORGOT PASSWORD - Step 1: send OTP to owner's Gmail (valid 10 mins)
    @PostMapping("/forgot-password/request")
    public ResponseEntity<?> forgotPasswordRequest(@RequestBody Map<String, String> req) {
        try {
            adminService.requestPasswordOtp(req.get("email"));
            return ResponseEntity.ok(Map.of("message", "OTP sent to your Gmail"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // FORGOT PASSWORD - Step 2: verify OTP + new password
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> forgotPasswordReset(@RequestBody Map<String, String> req) {
        try {
            adminService.resetPasswordWithOtp(req.get("email"), req.get("otp"), req.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "Password reset successfully. Please login."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // FORGOT EMAIL - send primary email to recovery email
    @PostMapping("/forgot-email")
    public ResponseEntity<?> forgotEmail(@RequestBody Map<String, String> req) {
        try {
            String recovery = req.get("recoveryEmail") != null ? req.get("recoveryEmail") : req.get("email");
            adminService.sendEmailReminder(recovery);
            return ResponseEntity.ok(Map.of("message", "Your owner email has been sent to your recovery email"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}