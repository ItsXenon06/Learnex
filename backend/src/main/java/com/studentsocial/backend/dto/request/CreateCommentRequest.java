package com.studentsocial.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateCommentRequest {

    // NOT validated — controller always overwrites this with the JWT-resolved
    // userId. The @NotNull was rejecting every request before the controller
    // could set it, causing the "must not be null" error on every comment submit.
    private UUID userId;

    @NotBlank(message = "content must not be blank")
    private String content;

    // Optional — null = top-level comment, non-null = reply
    private UUID parentId;
}