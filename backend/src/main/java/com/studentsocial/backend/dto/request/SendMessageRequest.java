package com.studentsocial.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class SendMessageRequest {

    // NOT validated — controller overwrites this from JWT.
    // Same @NotNull pattern that was breaking comments and DM creation.
    private UUID userId;

    @NotBlank(message = "content must not be blank")
    private String content;

    // Optional — UUID of the message being replied to
    private UUID replyToId;
}