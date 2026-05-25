package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "content_flag")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(name = "content_id", nullable = false)
    private UUID contentId;

    @Column(name = "flag_type", nullable = false, length = 50)
    private String flagType; // 'spam' | 'hate_speech' | 'nsfw' | 'plagiarism'

    @Column(name = "auto_flagged_at", nullable = false)
    @Builder.Default
    private LocalDateTime autoFlaggedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        autoFlaggedAt = LocalDateTime.now();
    }
}
