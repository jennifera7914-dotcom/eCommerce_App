package com.phoneaccessories.backend.entity;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    private BigDecimal mrp;

    private Integer discount;

    @Column(nullable = false)
    private String category;

    private String brand;

    @Column(columnDefinition = "TEXT")
    private String image1;

    @Column(columnDefinition = "TEXT")
    private String image2;

    // NEW: Stores compatible phone models (e.g., "iPhone 15, Samsung S24, Universal")
    @Column(columnDefinition = "TEXT")
    private String compatiblePhones;

    private Integer stockQty = 0;

    @Column(nullable = false)
    private Boolean inStock = true;

    @Column(nullable = false)
    private Boolean isFeatured = false;

    @Column(nullable = false)
    private Boolean isNewArrival = false;

    private Double rating = 4.5;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    // Runs automatically before saving a NEW product
    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        syncFields();
    }

    // Runs automatically before saving an EDITED product
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
        syncFields();
    }

    private void syncFields() {
        // Admin enters ONLY MRP -> sync price to match MRP automatically
        if (this.mrp != null) {
            this.price = this.mrp;
        } else if (this.price != null) {
            this.mrp = this.price;
        } else {
            this.mrp = BigDecimal.ZERO;
            this.price = BigDecimal.ZERO;
        }
        this.discount = 0;

        // Auto-calculate In Stock from Stock Quantity
        if (this.stockQty == null) this.stockQty = 0;
        this.inStock = this.stockQty > 0;

        if (this.isFeatured == null) this.isFeatured = false;
        if (this.isNewArrival == null) this.isNewArrival = false;
        if (this.rating == null) this.rating = 4.5;
    }
}