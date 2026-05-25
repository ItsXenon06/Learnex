package com.studentsocial.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReactRequest {

    // NOT validated with @NotNull — the controller always overwrites this
    // with the JWT-resolved userId. Sending it from the client is optional;
    // the server ignores whatever the client sends and sets it from the token.
    private UUID userId;

    // Valid values: like, love, insightful, support, celebrate
    @NotBlank(message = "reactionType is required")
    private String reactionType;
}