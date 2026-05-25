package com.studentsocial.backend.service;

import com.studentsocial.backend.dto.request.UpdatePreferenceRequest;
import com.studentsocial.backend.dto.response.NotificationPageResponse;
import com.studentsocial.backend.dto.response.NotificationResponse;
import com.studentsocial.backend.exception.ResourceNotFoundException;
import com.studentsocial.backend.model.Notification;
import com.studentsocial.backend.model.NotificationPreference;
import com.studentsocial.backend.model.User;
import com.studentsocial.backend.repository.NotificationPreferenceRepository;
import com.studentsocial.backend.repository.NotificationRepository;
import com.studentsocial.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    // ---------------------------------------------------------------
    // Internal API — called by other services to create notifications
    // ---------------------------------------------------------------

    /**
     * Create a notification for a user.
     * Called internally by PostReactionService, CommentService, FollowService, etc.
     * Silently skips if the recipient has disabled in_app for this type.
     *
     * @param recipientId  the user who receives the notification
     * @param type         notification type: like | comment | mention | follow | message | group_invite
     * @param payload      flexible map serialised into payload_json, e.g.:
     *                     { "actorId": "uuid", "actorName": "Minh Phu", "postId": "uuid" }
     */
    @Transactional
    public void send(UUID recipientId, String type, Map<String, Object> payload) {
        // Skip if recipient has disabled in_app for this type
        boolean suppressed = preferenceRepository
                .findByUserIdAndType(recipientId, type)
                .map(p -> !p.isInApp())
                .orElse(false);

        if (suppressed) {
            log.debug("Notification suppressed for user {} type {}", recipientId, type);
            return;
        }

        User recipient = userRepository.findById(recipientId).orElse(null);
        if (recipient == null) {
            log.warn("send() called with unknown recipientId {}", recipientId);
            return;
        }

        Notification notification = Notification.builder()
                .user(recipient)
                .type(type)
                .payloadJson(payload != null ? payload : new HashMap<>())
                .build();

        notificationRepository.save(notification);
    }

    // ---------------------------------------------------------------
    // Convenience factory methods for common notification types
    // ---------------------------------------------------------------

    /** Actor followed the recipient. */
    public void sendFollow(UUID recipientId, UUID actorId, String actorName) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("actorId", actorId.toString());
        payload.put("actorName", actorName);
        send(recipientId, "follow", payload);
    }

    /** Actor liked the recipient's post. */
    public void sendLike(UUID recipientId, UUID actorId, String actorName,
                         UUID postId, String reactionType) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("actorId", actorId.toString());
        payload.put("actorName", actorName);
        payload.put("postId", postId.toString());
        payload.put("reactionType", reactionType);
        send(recipientId, "like", payload);
    }

    /** Actor commented on the recipient's post (or replied to their comment). */
    public void sendComment(UUID recipientId, UUID actorId, String actorName,
                            UUID postId, UUID commentId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("actorId", actorId.toString());
        payload.put("actorName", actorName);
        payload.put("postId", postId.toString());
        payload.put("commentId", commentId.toString());
        send(recipientId, "comment", payload);
    }

    /** Actor mentioned the recipient in a post or comment. */
    public void sendMention(UUID recipientId, UUID actorId, String actorName,
                            String targetType, UUID targetId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("actorId", actorId.toString());
        payload.put("actorName", actorName);
        payload.put("targetType", targetType);  // 'post' | 'comment'
        payload.put("targetId", targetId.toString());
        send(recipientId, "mention", payload);
    }

    /** Actor sent a message in a conversation. */
    public void sendMessage(UUID recipientId, UUID actorId, String actorName,
                            UUID conversationId, UUID messageId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("actorId",        actorId.toString());
        payload.put("actorName",      actorName);
        payload.put("conversationId", conversationId.toString());
        payload.put("messageId",      messageId.toString());
        send(recipientId, "message", payload);
    }
    // ---------------------------------------------------------------
    // User-facing API
    // ---------------------------------------------------------------

    /**
     * GET /api/notifications
     * Returns paginated notifications for a user, newest first.
     * Pass unreadOnly=true to filter to unread only.
     */
    @Transactional(readOnly = true)
    public NotificationPageResponse getNotifications(UUID userId, int page, int size, boolean unreadOnly) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> result = unreadOnly
                ? notificationRepository.findUnreadByUserId(userId, pageable)
                : notificationRepository.findByUserId(userId, pageable);

        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);

        List<NotificationResponse> notifications = result.getContent()
                .stream()
                .map(this::toResponse)
                .toList();

        return NotificationPageResponse.builder()
                .notifications(notifications)
                .unreadCount(unreadCount)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .hasNext(result.hasNext())
                .build();
    }

    /**
     * PUT /api/notifications/{id}/read
     * Mark a single notification as read. Only the owner can mark their own.
     */
    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UUID userId) {
        int updated = notificationRepository.markAsRead(notificationId, userId);
        if (updated == 0) {
            throw new ResourceNotFoundException("Notification not found");
        }
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        return toResponse(notification);
    }

    /**
     * PUT /api/notifications/read-all
     * Mark ALL unread notifications for a user as read.
     * Returns the number of notifications that were updated.
     */
    @Transactional
    public int markAllAsRead(UUID userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.markAllAsRead(userId);
    }

    // ---------------------------------------------------------------
    // Notification Preferences
    // ---------------------------------------------------------------

    /**
     * GET /api/notifications/preferences
     * Returns the user's preferences for all notification types they have configured.
     */
    @Transactional(readOnly = true)
    public List<NotificationPreference> getPreferences(UUID userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return preferenceRepository.findByUserId(userId);
    }

    /**
     * PUT /api/notifications/preferences/{type}
     * Upsert the preference for a specific notification type.
     * Creates the row if it doesn't exist yet.
     */
    @Transactional
    public NotificationPreference updatePreference(UUID userId, String type,
                                                   UpdatePreferenceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        NotificationPreference pref = preferenceRepository
                .findByUserIdAndType(userId, type)
                .orElseGet(() -> NotificationPreference.builder()
                        .user(user)
                        .type(type)
                        .build());

        if (request.getEmail() != null) pref.setEmail(request.getEmail());
        if (request.getPush()  != null) pref.setPush(request.getPush());
        if (request.getInApp() != null) pref.setInApp(request.getInApp());

        return preferenceRepository.save(pref);
    }

    // ---------------------------------------------------------------
    // Mapper
    // ---------------------------------------------------------------

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUser().getId())
                .type(n.getType())
                .payload(n.getPayloadJson())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}