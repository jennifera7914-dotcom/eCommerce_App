package com.phoneaccessories.backend.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDTO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal mrp;
    private Integer discount;
    private String category;
    private String brand;
    private String image1;
    private String image2;
    private Integer stock;
    private Boolean inStock;
    private Boolean isFeatured;
    private Boolean isNewArrival;
    private Double rating;
}