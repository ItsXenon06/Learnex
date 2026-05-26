package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.response.AttachmentResponse;
import com.studentsocial.backend.model.MediaFile;
import com.studentsocial.backend.model.User;
import com.studentsocial.backend.repository.MediaFileRepository;
import com.studentsocial.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaFileRepository mediaFileRepository;
    private final UserRepository      userRepository;

    // Set in application.properties: learnex.upload.dir=./uploads
    @Value("${learnex.upload.dir:./uploads}")
    private String uploadDir;

    // Base URL for serving files — e.g. http://localhost:1008/learnex
    // Spring will serve files under /uploads/** via WebMvcConfigurer (wire separately)
    // or you can point this to an S3 bucket URL later.
    @Value("${learnex.upload.base-url:http://localhost:1008/learnex/uploads}")
    private String baseUrl;

    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    private static final java.util.Set<String> ALLOWED_TYPES = java.util.Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "video/mp4", "video/webm",
            "application/pdf"
    );

    /**
     * POST /api/media/upload
     * Accepts a single multipart file, saves to disk, creates a MediaFile row.
     * Returns {id, url, mimeType, type} — the id is passed back in CreatePostRequest.mediaIds.
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<AttachmentResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails principal) throws IOException {

        // Validate
        String mime = file.getContentType();
        if (mime == null || !ALLOWED_TYPES.contains(mime)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Unsupported file type: " + mime));
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File exceeds 10 MB limit"));
        }

        // Resolve owner
        User owner = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Build a unique file name: {uuid}.{ext}
        String originalName = file.getOriginalFilename() != null
                ? file.getOriginalFilename() : "file";
        String ext        = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.')) : "";
        String bucketKey  = UUID.randomUUID() + ext;

        // Save to disk
        Path dir  = Paths.get(uploadDir);
        Files.createDirectories(dir);
        Path dest = dir.resolve(bucketKey);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        String url = baseUrl + "/" + bucketKey;

        // Derive attachment type
        String type = mime.startsWith("video/") ? "video"
                    : mime.startsWith("image/") ? "image"
                    : mime.equals("application/pdf") ? "pdf"
                    : "document";

        // Persist MediaFile row
        MediaFile media = mediaFileRepository.save(MediaFile.builder()
                .owner(owner)
                .url(url)
                .bucketKey(bucketKey)
                .mimeType(mime)
                .sizeBytes(file.getSize())
                .status("ready")
                .build());

        return ResponseEntity.ok(ApiResponse.success(AttachmentResponse.builder()
                .id(media.getId())
                .url(url)
                .mimeType(mime)
                .type(type)
                .build()));
    }
}