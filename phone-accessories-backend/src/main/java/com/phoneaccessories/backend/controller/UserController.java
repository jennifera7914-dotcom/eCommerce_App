package com.phoneaccessories.backend.controller;

import com.phoneaccessories.backend.entity.User;
import com.phoneaccessories.backend.dto.LoginRequest;
import com.phoneaccessories.backend.dto.LoginResponse;
import com.phoneaccessories.backend.dto.UserDTO;
import com.phoneaccessories.backend.repository.UserRepository;
import com.phoneaccessories.backend.config.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping("/api/auth")
    public ResponseEntity<?> getProfile(@PathVariable Long userId) {
        try {
            Optional<User> user = userRepository.findById(userId);
            if (user.isPresent()) {
                return ResponseEntity.ok(user.get());
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            if (userRepository.existsByPhone(user.getPhone())) {
                return ResponseEntity.badRequest().body("Phone already registered");
            }

            user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
            user.setIsApproved(false);

            User savedUser = userRepository.save(user);

            return ResponseEntity.ok(UserDTO.builder()
                    .id(savedUser.getId())
                    .phone(savedUser.getPhone())
                    .name(savedUser.getName())
                    .isApproved(savedUser.getIsApproved())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Optional<User> userOpt = userRepository.findByPhone(request.getPhone());

            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body("User not found");
            }

            User user = userOpt.get();

            if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                return ResponseEntity.badRequest().body("Invalid password");
            }

            if (!user.getIsApproved()) {
                return ResponseEntity.status(403)
                        .body("Waiting for shop approval. Please try again later.");
            }

            String token = jwtUtils.generateToken(user.getPhone());

            return ResponseEntity.ok(LoginResponse.builder()
                    .token(token)
                    .user(UserDTO.builder()
                            .id(user.getId())
                            .phone(user.getPhone())
                            .name(user.getName())
                            .photoUrl(user.getPhotoUrl())
                            .isApproved(user.getIsApproved())
                            .build())
                    .message("Login successful")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String token) {
        try {
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            String phone = jwtUtils.getPhoneFromToken(token);
            Optional<User> user = userRepository.findByPhone(phone);

            if (user.isPresent()) {
                return ResponseEntity.ok(UserDTO.builder()
                        .id(user.get().getId())
                        .phone(user.get().getPhone())
                        .name(user.get().getName())
                        .photoUrl(user.get().getPhotoUrl())
                        .isApproved(user.get().getIsApproved())
                        .build());
            }

            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}