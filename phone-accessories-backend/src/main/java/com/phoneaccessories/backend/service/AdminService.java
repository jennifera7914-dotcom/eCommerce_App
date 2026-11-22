package com.phoneaccessories.backend.service;

import com.phoneaccessories.backend.entity.Admin;
import com.phoneaccessories.backend.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class AdminService {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private Random random = new Random();

    public boolean adminExists() {
        return adminRepository.count() > 0;
    }

    // ONE-TIME OWNER SETUP - locked after first owner is created
    public Admin setupAdmin(String email, String recoveryEmail, String password) {
        if (adminExists()) throw new RuntimeException("Owner already exists. Please login.");
        if (email == null || !email.toLowerCase().endsWith("@gmail.com")) throw new RuntimeException("Owner email must end with @gmail.com");
        if (recoveryEmail == null || !recoveryEmail.toLowerCase().endsWith("@gmail.com")) throw new RuntimeException("Recovery email must end with @gmail.com");
        if (email.equalsIgnoreCase(recoveryEmail)) throw new RuntimeException("Primary and Recovery email must be different");
        if (password == null || password.length() < 4) throw new RuntimeException("Password must be at least 4 characters");
        if (adminRepository.existsByEmail(email.toLowerCase())) throw new RuntimeException("Owner email already registered");

        Admin admin = new Admin();
        admin.setEmail(email.toLowerCase());
        admin.setRecoveryEmail(recoveryEmail.toLowerCase());
        admin.setPasswordHash(passwordEncoder.encode(password));
        return adminRepository.save(admin);
    }

    public Optional<Admin> loginAdmin(String email, String password) {
        if (email == null || password == null) return Optional.empty();
        Optional<Admin> opt = adminRepository.findByEmail(email.toLowerCase());
        if (opt.isPresent() && passwordEncoder.matches(password, opt.get().getPasswordHash())) return opt;
        return Optional.empty();
    }

    // FORGOT PASSWORD - Step 1: Send 6-digit OTP to owner's Gmail, valid 10 mins
    public void requestPasswordOtp(String email) {
        Admin admin = adminRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Owner email not found"));
        String otp = String.valueOf(100000 + random.nextInt(900000));
        admin.setOtp(otp);
        admin.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        adminRepository.save(admin);

        System.out.println("Owner OTP for " + email + " is: " + otp); // demo testing

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(admin.getEmail());
        msg.setSubject("Mobile Accessory Hub - Owner Password Reset OTP");
        msg.setText("Your OTP to reset Owner password is: " + otp + "\n\nValid for 10 minutes.\nIf you did not request this, ignore this mail.");
        mailSender.send(msg);
    }

    // FORGOT PASSWORD - Step 2: Verify OTP + set new password
    public void resetPasswordWithOtp(String email, String otp, String newPassword) {
        Admin admin = adminRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Owner email not found"));
        if (admin.getOtp() == null || !admin.getOtp().equals(otp)) throw new RuntimeException("Invalid OTP");
        if (admin.getOtpExpiry() == null || admin.getOtpExpiry().isBefore(LocalDateTime.now())) throw new RuntimeException("OTP expired. Request again.");
        if (newPassword == null || newPassword.length() < 4) throw new RuntimeException("Password must be at least 4 characters");

        admin.setPasswordHash(passwordEncoder.encode(newPassword));
        admin.setOtp(null);
        admin.setOtpExpiry(null);
        adminRepository.save(admin);
    }

    // FORGOT EMAIL - Send primary email to recovery email
    public void sendEmailReminder(String recoveryEmail) {
        Admin admin = adminRepository.findByRecoveryEmail(recoveryEmail.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Recovery email not found"));
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(admin.getRecoveryEmail());
        msg.setSubject("Mobile Accessory Hub - Your Owner Email Reminder");
        msg.setText("Hi Owner,\n\nYour Primary Owner Email is: " + admin.getEmail() + "\n\nUse it to login or reset password.\nIf you did not request this, ignore this mail.");
        mailSender.send(msg);
    }
}