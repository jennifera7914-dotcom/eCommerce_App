package com.phoneaccessories.backend.controller;

import com.phoneaccessories.backend.entity.Cart;
import com.phoneaccessories.backend.entity.Product;
import com.phoneaccessories.backend.entity.User;
import com.phoneaccessories.backend.repository.CartRepository;
import com.phoneaccessories.backend.repository.ProductRepository;
import com.phoneaccessories.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    @Autowired private CartRepository cartRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;

    private Map<String, Object> toMap(Cart c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("userId", c.getUser().getId());
        m.put("productId", c.getProduct().getId());
        m.put("name", c.getProduct().getName());
        m.put("price", c.getProduct().getPrice());
        m.put("mrp", c.getProduct().getMrp());
        m.put("image1", c.getProduct().getImage1());
        m.put("quantity", c.getQuantity());
        return m;
    }

    @PostMapping("/add")
    public ResponseEntity<?> add(@RequestBody Map<String, Object> req) {
        try {
            Long userId = Long.valueOf(req.get("userId").toString());
            Long productId = Long.valueOf(req.get("productId").toString());
            int qty = Integer.parseInt(req.getOrDefault("quantity", "1").toString());

            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
            Product product = productRepository.findById(productId).orElseThrow(() -> new RuntimeException("Product not found"));

            Cart existing = cartRepository.findByUser_IdAndProduct_Id(userId, productId).orElse(null);
            Cart saved;
            if (existing != null) {
                existing.setQuantity(existing.getQuantity() + qty);
                saved = cartRepository.save(existing);
            } else {
                Cart c = new Cart();
                c.setUser(user);
                c.setProduct(product);
                c.setQuantity(qty);
                saved = cartRepository.save(c);
            }
            return ResponseEntity.ok(toMap(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getCart(@PathVariable Long userId) {
        List<Cart> list = cartRepository.findByUser_Id(userId);
        return ResponseEntity.ok(list.stream().map(this::toMap).toList());
    }

    @PutMapping("/update")
    public ResponseEntity<?> update(@RequestBody Map<String, Object> req) {
        try {
            Long userId = Long.valueOf(req.get("userId").toString());
            Long productId = Long.valueOf(req.get("productId").toString());
            int qty = Integer.parseInt(req.get("quantity").toString());
            Cart c = cartRepository.findByUser_IdAndProduct_Id(userId, productId)
                    .orElseThrow(() -> new RuntimeException("Cart item not found"));
            if (qty <= 0) {
                cartRepository.delete(c);
                return ResponseEntity.ok(Map.of("message", "Removed"));
            }
            c.setQuantity(qty);
            return ResponseEntity.ok(toMap(cartRepository.save(c)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/remove")
    public ResponseEntity<?> remove(@RequestParam Long userId, @RequestParam Long productId) {
        cartRepository.deleteByUser_IdAndProduct_Id(userId, productId);
        return ResponseEntity.ok(Map.of("message", "Removed"));
    }
}