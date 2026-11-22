package com.phoneaccessories.backend.service;

import com.phoneaccessories.backend.entity.Product;
import com.phoneaccessories.backend.entity.Category;
import com.phoneaccessories.backend.repository.ProductRepository;
import com.phoneaccessories.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;

    public List<Category> getAllCategories() {
        return categoryRepo.findAll();
    }

    public List<Product> getAllProducts() {
        return productRepo.findAll();
    }

    public List<Product> getFeaturedProducts() {
        return productRepo.findByIsFeaturedTrue();
    }

    public List<Product> getNewArrivals() {
        return productRepo.findByIsNewArrivalTrue();
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepo.findByCategory(category);
    }

    public List<Product> searchProducts(String query) {
        return productRepo.findByNameContainingIgnoreCaseOrBrandContainingIgnoreCase(query, query);
    }
}