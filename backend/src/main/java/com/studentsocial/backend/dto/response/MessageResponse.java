package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class MessageResponse {

    private UUID id;
    private UUID conversationId;

    private UUID senderId;
    private String senderEmail;
    private String senderDisplayName;

    private String content;

    /** Present if this message is a reply — the UUID of the original message. */
    private UUID replyToId;

    private boolean isDeleted;
    private LocalDateTime sentAt;
    private LocalDateTime editedAt;
}