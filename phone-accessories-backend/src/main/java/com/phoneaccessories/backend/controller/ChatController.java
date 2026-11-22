package com.phoneaccessories.backend.controller;

import com.phoneaccessories.backend.entity.Message;
import com.phoneaccessories.backend.entity.User;
import com.phoneaccessories.backend.repository.MessageRepository;
import com.phoneaccessories.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired private MessageRepository messageRepository;
    @Autowired private UserRepository userRepository;

    private Map<String, Object> toMap(Message m) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("userId", m.getUser() != null ? m.getUser().getId() : null);
        map.put("customerName", m.getUser() != null ? m.getUser().getName() : "");
        map.put("shopName", m.getUser() != null ? m.getUser().getShopName() : "");
        map.put("phone", m.getUser() != null ? m.getUser().getPhone() : "");
        map.put("sender", m.getSender());
        map.put("text", m.getText());
        map.put("createdAt", m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
        return map;
    }

    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody Map<String, Object> req) {
        try {
            Long userId = Long.valueOf(req.get("userId").toString());
            String sender = req.getOrDefault("sender", "customer").toString();
            String text = req.get("text").toString();
            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
            Message m = new Message();
            m.setUser(user);
            m.setSender(sender);
            m.setText(text);
            m.setCreatedAt(LocalDateTime.now());
            return ResponseEntity.ok(toMap(messageRepository.save(m)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserChat(@PathVariable Long userId) {
        List<Message> list = messageRepository.findByUser_IdOrderByCreatedAtAsc(userId);
        return ResponseEntity.ok(list.stream().map(this::toMap).toList());
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllChat() {
        List<Message> list = messageRepository.findAllByOrderByCreatedAtAsc();
        return ResponseEntity.ok(list.stream().map(this::toMap).toList());
    }
}