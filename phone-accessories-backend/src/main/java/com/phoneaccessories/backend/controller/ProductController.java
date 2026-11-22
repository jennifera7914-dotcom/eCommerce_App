package com.phoneaccessories.backend.controller;

import com.phoneaccessories.backend.entity.Product;
import com.phoneaccessories.backend.entity.Category;
import com.phoneaccessories.backend.repository.ProductRepository;
import com.phoneaccessories.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    // 1. GET ALL PRODUCTS (with Category, Phone Model, Featured, New Arrival & Sort filters)
    @GetMapping
    public ResponseEntity<?> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String phoneModel,
            @RequestParam(required = false) String sort) {

        try {
            List<Product> products = productRepository.findAll();

            // Filter by Category
            if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("All")) {
                products = products.stream()
                        .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(category.trim()))
                        .collect(Collectors.toList());
            }



            // Sort: newest products at top by ID (newly added appear first)
            if ("price-low".equals(sort)) {
                products.sort((a, b) -> getSafeMrp(a).compareTo(getSafeMrp(b)));
            } else if ("price-high".equals(sort)) {
                products.sort((a, b) -> getSafeMrp(b).compareTo(getSafeMrp(a)));
            } else if ("rating".equals(sort)) {
                products.sort((a, b) -> Double.compare(
                        b.getRating() != null ? b.getRating() : 0.0,
                        a.getRating() != null ? a.getRating() : 0.0));
            } else {
                products.sort((a, b) -> Long.compare(b.getId(), a.getId()));
            }

            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    private BigDecimal getSafeMrp(Product p) {
        if (p.getMrp() != null) return p.getMrp();
        if (p.getPrice() != null) return p.getPrice();
        return BigDecimal.ZERO;
    }

    // 2. GET SINGLE PRODUCT
    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        try {
            Optional<Product> product = productRepository.findById(id);
            return product.<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // 3. GET RELATED PRODUCTS (Same category, excluding current product)
    @GetMapping("/{id}/related")
    public ResponseEntity<?> getRelatedProducts(@PathVariable Long id) {
        try {
            Optional<Product> currentOpt = productRepository.findById(id);
            if (currentOpt.isEmpty()) return ResponseEntity.ok(List.of());

            String cat = currentOpt.get().getCategory();
            List<Product> related = productRepository.findAll().stream()
                    .filter(p -> !p.getId().equals(id) && p.getCategory() != null && p.getCategory().equalsIgnoreCase(cat))
                    .limit(6)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(related);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // 4. SMART SEARCH (Searches Name, Category, Brand, Description & Compatible Phones)
    @GetMapping("/search")
    public ResponseEntity<?> searchProducts(@RequestParam String q) {
        try {
            String query = q == null ? "" : q.trim().toLowerCase();
            List<Product> results = productRepository.findAll().stream()
                    .filter(p -> (p.getName() != null && p.getName().toLowerCase().contains(query))
                            || (p.getCategory() != null && p.getCategory().toLowerCase().contains(query))
                            || (p.getBrand() != null && p.getBrand().toLowerCase().contains(query))
                            || (p.getDescription() != null && p.getDescription().toLowerCase().contains(query))
                            || (p.getCompatiblePhones() != null && p.getCompatiblePhones().toLowerCase().contains(query)))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // 5. CREATE PRODUCT (Admin)
    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        try {
            ensureCategoryExists(product.getCategory());
            Product saved = productRepository.save(product);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // 6. UPDATE PRODUCT (Admin)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product updated) {
        try {
            Product ex = productRepository.findById(id).orElse(null);
            if (ex == null) return ResponseEntity.badRequest().body("Not found");

            updated.setId(id);
            updated.setCreatedAt(ex.getCreatedAt());
            ensureCategoryExists(updated.getCategory());

            Product saved = productRepository.save(updated);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // 7. DELETE PRODUCT (Admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // ================= CATEGORY ENDPOINTS =================

    // 8. GET ALL CATEGORIES (with live product counts!)
    @GetMapping("/categories/all")
    public ResponseEntity<?> getAllCategories() {
        try {
            List<Product> allProducts = productRepository.findAll();

            // Make sure any category used on existing products is also in the categories table
            for (Product p : allProducts) {
                ensureCategoryExists(p.getCategory());
            }

            List<Category> categories = categoryRepository.findAll();
            for (Category c : categories) {
                long count = allProducts.stream()
                        .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(c.getName()))
                        .count();
                c.setProductCount((int) count);
            }
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // 9. ADD CATEGORY (Admin)
    @PostMapping("/categories")
    public ResponseEntity<?> createCategory(@RequestBody Category category) {
        try {
            if (category.getName() == null || category.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Category name is required");
            }
            String cleanName = category.getName().trim();

            Optional<Category> existing = categoryRepository.findAll().stream()
                    .filter(c -> c.getName() != null && c.getName().equalsIgnoreCase(cleanName))
                    .findFirst();
            if (existing.isPresent()) {
                return ResponseEntity.ok(existing.get());
            }

            category.setName(cleanName);
            if (category.getIcon() == null || category.getIcon().isEmpty()) {
                category.setIcon("📱");
            }
            category.setProductCount(0);
            return ResponseEntity.ok(categoryRepository.save(category));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // 10. DELETE CATEGORY (Admin)
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            categoryRepository.deleteById(id);
            return ResponseEntity.ok("Category deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    private void ensureCategoryExists(String categoryName) {
        if (categoryName == null || categoryName.trim().isEmpty()) return;
        String clean = categoryName.trim();
        boolean exists = categoryRepository.findAll().stream()
                .anyMatch(c -> c.getName() != null && c.getName().equalsIgnoreCase(clean));
        if (!exists) {
            Category c = new Category();
            c.setName(clean);
            c.setIcon("📱");
            c.setProductCount(0);
            categoryRepository.save(c);
        }
    }
}