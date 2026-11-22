package com.phoneaccessories.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // Called automatically when owner creates a customer
    public void sendPinEmail(String toEmail, String customerName, String shopName, String pin, String phone) {
        // For college demo testing - you can see PIN in IntelliJ console if email fails
        System.out.println("PIN for " + phone + " (" + toEmail + ") is: " + pin);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to Mobile Accessory Hub - Your Login PIN");
            message.setText(
                    "Hi " + customerName + ",\n\n" +
                            "Your shop '" + shopName + "' is registered with Mobile Accessory Hub.\n\n" +
                            "Your Login Details:\n" +
                            "Phone Number: " + phone + "\n" +
                            "PIN: " + pin + "\n\n" +
                            "Open the Mobile Accessory Hub App and login with your Phone Number and PIN.\n\n" +
                            "If you have any issue, contact shop owner.\n\n" +
                            "Thank you!"
            );
            mailSender.send(message);
            System.out.println("Email sent successfully to " + toEmail);
        } catch (Exception e) {
            // Don't fail customer creation if email fails - PIN is printed above
            System.out.println("Email failed for " + toEmail + ": " + e.getMessage());
        }
    }
}