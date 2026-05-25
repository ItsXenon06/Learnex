package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "device")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 100)
    private String name;

    @Column(nullable = false, length = 30)
    private String platform; // 'web' | 'ios' | 'android'

    @Column(name = "push_token", columnDefinition = "TEXT")
    private String pushToken; // APNs / FCM token

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        validatePlatform();
    }

    @PreUpdate
    protected void onUpdate() {
        validatePlatform();
    }

    private void validatePlatform() {
        List<String> allowedPlatforms = Arrays.asList("web", "ios", "android");
        if (!allowedPlatforms.contains(platform)) {
            throw new IllegalStateException("Invalid platform: " + platform + ". Must be one of " + allowedPlatforms);
        }
    }
}