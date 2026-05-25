package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "moderation_action")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModerationAction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderator_id", nullable = false)
    private User moderator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id")
    private Report report;

    @Column(nullable = false, length = 50)
    private String action; // 'warn' | 'remove_content' | 'ban' | 'dismiss'

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "taken_at", nullable = false)
    @Builder.Default
    private LocalDateTime takenAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        takenAt = LocalDateTime.now();
    }
}
