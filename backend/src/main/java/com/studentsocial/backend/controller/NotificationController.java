package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.request.UpdatePreferenceRequest;
import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.response.NotificationPageResponse;
import com.studentsocial.backend.dto.response.NotificationResponse;
import com.studentsocial.backend.model.NotificationPreference;
import com.studentsocial.backend.repository.UserRepository;
import com.studentsocial.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository      userRepository;

    // ── Resolve UUID from JWT principal ───────────────────────────────────
    private UUID resolveUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();
    }

    // ── GET /api/notifications ────────────────────────────────────────────
    // Returns paginated notifications for the authenticated user, newest first.
    // Use unreadOnly=true to filter to unread only.
    @GetMapping
    public ResponseEntity<ApiResponse<NotificationPageResponse>> getNotifications(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0")     int     page,
            @RequestParam(defaultValue = "20")    int     size,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {

        UUID userId = resolveUserId(principal);
        NotificationPageResponse result =
                notificationService.getNotifications(userId, page, size, unreadOnly);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── PUT /api/notifications/{id}/read ──────────────────────────────────
    // Mark a single notification as read.
    // Only the owning user can mark their own notification.
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);
        NotificationResponse response = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ── PUT /api/notifications/read-all ───────────────────────────────────
    // Mark ALL unread notifications for the authenticated user as read.
    // Returns how many were updated.
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllAsRead(
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);
        int updated = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("updated", updated)));
    }

    // ── GET /api/notifications/preferences ───────────────────────────────
    // Returns the user's notification preferences for all configured types.
    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<List<NotificationPreference>>> getPreferences(
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);
        List<NotificationPreference> prefs = notificationService.getPreferences(userId);
        return ResponseEntity.ok(ApiResponse.success(prefs));
    }

    // ── PUT /api/notifications/preferences/{type} ─────────────────────────
    // Update (or create) preference for a specific notification type.
    // Valid types: like | comment | mention | follow | message |
    //              group_invite | group_join_request | friend_request |
    //              share | poll_ended
    // Body: { "email": true, "push": false, "inApp": true }
    // All fields optional — only provided fields are updated.
    @PutMapping("/preferences/{type}")
    public ResponseEntity<ApiResponse<NotificationPreference>> updatePreference(
            @PathVariable String type,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody UpdatePreferenceRequest request) {

        UUID userId = resolveUserId(principal);
        NotificationPreference pref = notificationService.updatePreference(userId, type, request);
        return ResponseEntity.ok(ApiResponse.success(pref));
    }
}