package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Valid types: 'like' | 'comment' | 'mention' | 'follow' | 'message' | 'group_invite'
    @Column(nullable = false, length = 50)
    private String type;

    // Flexible JSONB payload — contents vary by type, e.g.:
    // follow:  { "actorId": "uuid", "actorName": "Minh Phu" }
    // like:    { "actorId": "uuid", "actorName": "...", "postId": "uuid" }
    // comment: { "actorId": "uuid", "actorName": "...", "postId": "uuid", "commentId": "uuid" }
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_json", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> payloadJson = new HashMap<>();

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}