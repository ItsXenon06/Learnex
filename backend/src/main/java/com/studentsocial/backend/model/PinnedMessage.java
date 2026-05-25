package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "pinned_message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(PinnedMessage.PinnedMessageId.class) // Using IdClass for composite primary key
public class PinnedMessage {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conv_id", nullable = false)
    private Conversation conversation;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pinned_by", nullable = false)
    private User pinnedBy;

    @Column(name = "pinned_at", nullable = false)
    @Builder.Default
    private LocalDateTime pinnedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        pinnedAt = LocalDateTime.now();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PinnedMessageId implements Serializable {
        private UUID conversation;
        private UUID message;
    }
}
