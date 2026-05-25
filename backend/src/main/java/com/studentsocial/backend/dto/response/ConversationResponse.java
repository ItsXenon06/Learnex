package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class ConversationResponse {

    private UUID id;
    private String type;         // 'dm' | 'group' | 'class'
    private String name;

    /** For DMs: the other participant's display info. */
    private UUID otherUserId;
    private String otherUserEmail;
    private String otherUserDisplayName;

    /** Preview of the last message — null if no messages yet. */
    private MessageResponse lastMessage;

    /** How many messages this user has not read in this conversation. */
    private long unreadCount;

    private LocalDateTime createdAt;
}