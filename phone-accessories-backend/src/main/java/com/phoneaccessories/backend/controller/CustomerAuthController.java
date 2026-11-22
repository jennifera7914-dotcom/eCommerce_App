package com.phoneaccessories.backend.controller;

import com.phoneaccessories.backend.entity.Address;
import com.phoneaccessories.backend.entity.User;
import com.phoneaccessories.backend.repository.AddressRepository;
import com.phoneaccessories.backend.repository.UserRepository;
import com.phoneaccessories.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class CustomerAuthController {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private Map<String, Object> toCustomerMap(User u) {
        List<Address> addrs = addressRepository.findByUserId(u.getId());
        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("userId", u.getId()); // ProfileScreen uses userId name
        map.put("name", u.getName());
        map.put("shopName", u.getShopName());
        map.put("phone", u.getPhone());
        map.put("alternatePhone", u.getAlternatePhone());
        map.put("email", u.getEmail());
        map.put("gstNumber", u.getGstNumber());
        map.put("isApproved", u.getIsApproved());
        map.put("photoUrl", u.getPhotoUrl());
        map.put("address", addrs.isEmpty() ? null : addrs.get(0));
        return map;
    }

    // CUSTOMER LOGIN - Phone OR Name + 4-digit PIN
    // LoginScreen sends: { identifier, pin }
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        String identifier = req.get("identifier") != null ? req.get("identifier") : req.get("phone");
        String pin = req.get("pin") != null ? req.get("pin") : req.get("password");

        Optional<User> opt = userService.loginWithPin(identifier, pin);
        if (opt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid phone/name or PIN"));
        }
        User u = opt.get();
        if (u.getIsApproved() == null || !u.getIsApproved()) {
            return ResponseEntity.status(403).body(Map.of("message", "Waiting for shop approval. Please contact owner."));
        }

        Map<String, Object> result = toCustomerMap(u);
        result.put("message", "Login successful");
        result.put("user", toCustomerMap(u)); // safe for screens expecting data.user
        return ResponseEntity.ok(result);
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<?> profile(@PathVariable Long id) {
        Optional<User> opt = userService.getUserById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "Customer not found"));
        return ResponseEntity.ok(toCustomerMap(opt.get()));
    }

    @GetMapping("/check-approval/{id}")
    public ResponseEntity<?> checkApproval(@PathVariable Long id) {
        Optional<User> opt = userService.getUserById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "Customer not found"));
        return ResponseEntity.ok(Map.of("isApproved", opt.get().getIsApproved() != null && opt.get().getIsApproved()));
    }

    // Kept for compatibility - in this B2B app, owner normally creates customers.
    // Self-registered customers will be isApproved=false until owner approves.
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> req) {
        try {
            String phone = req.get("phone");
            String pin = req.get("pin") != null ? req.get("pin") : req.get("password");
            if (phone == null || pin == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Phone and PIN are required"));
            }
            if (userRepository.existsByPhone(phone)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Phone already registered"));
            }
            User u = new User();
            u.setName(req.get("name"));
            u.setPhone(phone);
            u.setEmail(req.get("email") != null ? req.get("email").toLowerCase() : null);
            u.setShopName(req.get("shopName"));
            u.setPasswordHash(passwordEncoder.encode(pin));
            u.setIsApproved(false);
            User saved = userRepository.save(u);
            return ResponseEntity.ok(toCustomerMap(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}