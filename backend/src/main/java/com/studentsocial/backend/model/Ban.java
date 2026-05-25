package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ban")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ban {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "banned_by", nullable = false)
    private User bannedBy;

    @Column(name = "scope_type", nullable = false, length = 20)
    @Builder.Default
    private String scopeType = "platform"; // 'platform' | 'school' | 'group'

    @Column(name = "scope_id")
    private UUID scopeId; // NULL for platform scope, school/group UUID otherwise

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt; // NULL = permanent ban

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}