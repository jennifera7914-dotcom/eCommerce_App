package com.phoneaccessories.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private String label;
    private String name;
    private String phone;

    private String line1;
    private String line2;
    private String city;
    private String state;
    private String pincode;

    @Builder.Default
    @Column(name = "is_default")
    private Boolean isDefault = false;
}