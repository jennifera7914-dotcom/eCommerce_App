package com.phoneaccessories.backend.controller;

import com.phoneaccessories.backend.entity.Order;
import com.phoneaccessories.backend.entity.OrderItem;
import com.phoneaccessories.backend.entity.Product;
import com.phoneaccessories.backend.entity.User;
import com.phoneaccessories.backend.repository.OrderRepository;
import com.phoneaccessories.backend.repository.ProductRepository;
import com.phoneaccessories.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired private OrderRepository orderRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;

    private Map<String, Object> toMap(Order o) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", o.getId());
        m.put("userId", o.getUser() != null ? o.getUser().getId() : null);
        m.put("customerName", o.getUser() != null ? o.getUser().getName() : "");
        m.put("shopName", o.getUser() != null ? o.getUser().getShopName() : "");
        m.put("phone", o.getUser() != null ? o.getUser().getPhone() : "");
        m.put("address", o.getAddress());
        m.put("status", o.getStatus());
        m.put("total", o.getTotalAmount());
        m.put("totalAmount", o.getTotalAmount());
        m.put("placedAt", o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
        m.put("createdAt", o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
        m.put("deliveryDate", o.getCreatedAt() != null ? o.getCreatedAt().plusDays(5).toString() : null);
        List<Map<String, Object>> items = new ArrayList<>();
        if (o.getItems() != null) {
            for (OrderItem it : o.getItems()) {
                Map<String, Object> im = new HashMap<>();
                im.put("productId", it.getProduct() != null ? it.getProduct().getId() : null);
                im.put("id", it.getProduct() != null ? it.getProduct().getId() : null);
                im.put("name", it.getProduct() != null ? it.getProduct().getName() : "");
                im.put("price", it.getPriceAtOrder());
                im.put("quantity", it.getQuantity());
                im.put("image1", it.getProduct() != null ? it.getProduct().getImage1() : null);
                items.add(im);
            }
        }
        m.put("items", items);
        int totalQty = items.stream().mapToInt(i -> (Integer) i.get("quantity")).sum();
        m.put("totalQuantity", totalQty);
        return m;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> req) {
        try {
            Long userId = Long.valueOf(req.get("userId").toString());
            String address = req.getOrDefault("address", "").toString();
            List<Map<String, Object>> itemsReq = (List<Map<String, Object>>) req.get("items");

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Order order = new Order();
            order.setUser(user);
            order.setAddress(address);
            order.setStatus("New");
            order.setCreatedAt(LocalDateTime.now());
            order.setUpdatedAt(LocalDateTime.now());

            BigDecimal total = BigDecimal.ZERO;
            List<OrderItem> items = new ArrayList<>();

            for (Map<String, Object> ir : itemsReq) {
                Long productId = Long.valueOf(ir.get("productId").toString());
                int qty = Integer.parseInt(ir.get("quantity").toString());
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
                int available = product.getStockQty() != null ? product.getStockQty() : 0;
                if (qty < 1) throw new RuntimeException("Invalid quantity for " + product.getName());
                if (qty > available) throw new RuntimeException("Only " + available + " left for " + product.getName());
                product.setStockQty(available - qty);
                product.setInStock(available - qty > 0);
                productRepository.save(product);
                BigDecimal price = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
                total = total.add(price.multiply(BigDecimal.valueOf(qty)));

                OrderItem oi = new OrderItem();
                oi.setOrder(order);
                oi.setProduct(product);
                oi.setQuantity(qty);
                oi.setPriceAtOrder(price);
                items.add(oi);
            }

            order.setTotalAmount(total);
            order.setItems(items);
            Order saved = orderRepository.save(order);
            return ResponseEntity.ok(toMap(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserOrders(@PathVariable Long userId) {
        List<Order> list = orderRepository.findByUser_IdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(list.stream().map(this::toMap).toList());
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllOrders() {
        List<Order> list = orderRepository.findAll();
        list.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return ResponseEntity.ok(list.stream().map(this::toMap).toList());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> req) {
        try {
            Order o = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
            o.setStatus(req.getOrDefault("status", "Delivered"));
            o.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(toMap(orderRepository.save(o)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}