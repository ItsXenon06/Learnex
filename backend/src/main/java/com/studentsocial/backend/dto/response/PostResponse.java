package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PostResponse {
    private UUID   id;
    private UUID   authorId;
    private String authorEmail;
    private String authorDisplayName;
    private String authorHeadline;     // shown in post card sub-line
    private String content;
    private String visibility;
    private Boolean isEdited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Reaction summary — populated by PostService so the feed doesn't need
    // a separate GET /reactions call per post.
    private List<ReactionSummaryResponse> reactions;

    // FIX: FeedPage reads post.commentCount for the stats bar.
    // Was missing — comment count always showed as 0.
    private int commentCount;

    // FIX: FeedPage reads post.saved to show bookmark state on load.
    // PostService should set this based on whether the requesting user
    // has a saved_post row for this post.
    private boolean saved;
    private List<AttachmentResponse> attachments;
}