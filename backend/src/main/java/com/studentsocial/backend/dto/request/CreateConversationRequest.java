package com.studentsocial.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateConversationRequest {

    // NOT validated — controller overwrites this from JWT.
    // The @NotNull caused "must not be null" when the frontend
    // (correctly) stopped sending userId after the JWT migration.
    private UUID userId;

    // Still required — the frontend must always provide the recipient
    @NotNull(message = "recipientId is required")
    private UUID recipientId;
}