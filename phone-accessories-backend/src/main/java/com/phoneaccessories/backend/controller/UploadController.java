package com.phoneaccessories.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/products/uploads")
@CrossOrigin(origins = "*")
public class UploadController {

    private final Path uploadDir = Paths.get("uploads").toAbsolutePath();

    // 1. Saves an uploaded image from Admin's device into the /uploads folder
    @PostMapping
    public ResponseEntity<?> uploadImage(@RequestBody Map<String, String> payload) {
        try {
            String base64Data = payload.get("base64");
            String originalName = payload.getOrDefault("fileName", "photo.jpg");

            if (base64Data == null || base64Data.isEmpty()) {
                return ResponseEntity.badRequest().body("No image data received");
            }

            // Strip "data:image/jpeg;base64," header if browser attached it
            if (base64Data.contains(",")) {
                base64Data = base64Data.split(",")[1];
            }

            Files.createDirectories(uploadDir);

            String ext = ".jpg";
            if (originalName.toLowerCase().endsWith(".png")) ext = ".png";
            else if (originalName.toLowerCase().endsWith(".webp")) ext = ".webp";

            String savedFileName = "img_" + System.currentTimeMillis() + ext;
            Path filePath = uploadDir.resolve(savedFileName);

            byte[] imageBytes = Base64.getDecoder().decode(base64Data);
            Files.write(filePath, imageBytes);

            // Return the clean path to store in the database
            return ResponseEntity.ok(Map.of("imageUrl", "/api/products/uploads/" + savedFileName));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload error: " + e.getMessage());
        }
    }

    // 2. Serves the saved image back to Customer & Admin screens
    @GetMapping("/{filename:.+}")
    public ResponseEntity<byte[]> getImage(@PathVariable String filename) {
        try {
            Path filePath = uploadDir.resolve(filename).normalize();
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] bytes = Files.readAllBytes(filePath);
            MediaType mediaType = MediaType.IMAGE_JPEG;
            if (filename.toLowerCase().endsWith(".png")) mediaType = MediaType.IMAGE_PNG;

            return ResponseEntity.ok().contentType(mediaType).body(bytes);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}