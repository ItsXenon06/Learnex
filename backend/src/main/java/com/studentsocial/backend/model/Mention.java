package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "mention")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mention {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id")
    private Comment comment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentioned_user_id", nullable = false)
    private User mentionedUser;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // A single method for PrePersist to handle initial setup and validation
    @PrePersist
    protected void prePersistCallback() {
        if (createdAt == null) { // Ensure createdAt is set if not already by @Builder.Default
            createdAt = LocalDateTime.now();
        }
        performTargetValidation();
    }

    // A single method for PreUpdate to handle validation
    @PreUpdate
    protected void preUpdateCallback() {
        performTargetValidation();
    }

    /**
     * Validates that exactly one of post or comment is set.
     * This mirrors the DB constraint: ck_mention_target
     */
    private void performTargetValidation() {
        boolean hasPost = post != null;
        boolean hasComment = comment != null;
        if (hasPost == hasComment) {
            throw new IllegalStateException("Mention must have exactly one target: either post or comment, not both or neither");
        }
    }
}
