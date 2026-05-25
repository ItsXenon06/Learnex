package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class NotificationResponse {

    private UUID id;
    private UUID userId;

    // 'like' | 'comment' | 'mention' | 'follow' | 'message' | 'group_invite'
    private String type;

    // Flexible payload — contents depend on type
    private Map<String, Object> payload;

    private boolean isRead;
    private LocalDateTime createdAt;
}