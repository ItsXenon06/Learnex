package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class CommentResponse {

    private UUID id;
    private UUID postId;
    private UUID parentId;

    private UUID authorId;
    private String authorEmail;
    private String authorDisplayName;

    private String content;
    private boolean isEdited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<ReactionSummaryResponse> reactions;
    private List<CommentResponse> replies;
}