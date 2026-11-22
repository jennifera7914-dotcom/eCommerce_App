package com.phoneaccessories.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String phone;

    @Column(nullable = false)
    private String name;

    @Column(name = "shop_name")
    private String shopName;

    @Column(name = "alternate_phone")
    private String alternatePhone;

    // Nullable for now so old test users in DB don't break.
    // New customers added by owner will always have email (frontend validates it).
    @Column(unique = true)
    private String email;

    @Column(name = "gst_number")
    private String gstNumber;

    // For customers this stores the hashed 4-digit PIN.
    // For self-registered users it stores the hashed password.
    @Column(nullable = false)
    private String passwordHash;

    @Column(columnDefinition = "TEXT")
    private String photoUrl;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isApproved = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isApproved == null) this.isApproved = false;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}