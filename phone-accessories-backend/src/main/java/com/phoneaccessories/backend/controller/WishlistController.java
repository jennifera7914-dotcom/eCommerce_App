package com.phoneaccessories.backend.controller;

import com.phoneaccessories.backend.entity.Product;
import com.phoneaccessories.backend.entity.User;
import com.phoneaccessories.backend.entity.Wishlist;
import com.phoneaccessories.backend.repository.ProductRepository;
import com.phoneaccessories.backend.repository.UserRepository;
import com.phoneaccessories.backend.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "*")
public class WishlistController {

    @Autowired private WishlistRepository wishlistRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;

    private Map<String, Object> toMap(Wishlist w) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", w.getId());
        m.put("userId", w.getUser().getId());
        m.put("productId", w.getProduct().getId());
        m.put("name", w.getProduct().getName());
        m.put("price", w.getProduct().getPrice());
        m.put("mrp", w.getProduct().getMrp());
        m.put("image1", w.getProduct().getImage1());
        return m;
    }

    @PostMapping("/add")
    public ResponseEntity<?> add(@RequestBody Map<String, Object> req) {
        try {
            Long userId = Long.valueOf(req.get("userId").toString());
            Long productId = Long.valueOf(req.get("productId").toString());
            if (wishlistRepository.findByUser_IdAndProduct_Id(userId, productId).isPresent()) {
                return ResponseEntity.ok(Map.of("message", "Already in wishlist"));
            }
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
            Product product = productRepository.findById(productId).orElseThrow(() -> new RuntimeException("Product not found"));
            Wishlist w = new Wishlist();
            w.setUser(user);
            w.setProduct(product);
            return ResponseEntity.ok(toMap(wishlistRepository.save(w)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getWishlist(@PathVariable Long userId) {
        List<Wishlist> list = wishlistRepository.findByUser_Id(userId);
        return ResponseEntity.ok(list.stream().map(this::toMap).toList());
    }

    @DeleteMapping("/remove")
    public ResponseEntity<?> remove(@RequestParam Long userId, @RequestParam Long productId) {
        wishlistRepository.deleteByUser_IdAndProduct_Id(userId, productId);
        return ResponseEntity.ok(Map.of("message", "Removed"));
    }
}