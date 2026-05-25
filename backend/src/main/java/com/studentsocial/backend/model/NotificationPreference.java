package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
        name = "notification_preference",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "type"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false)
    @Builder.Default
    private boolean email = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean push = true;

    @Column(name = "in_app", nullable = false)
    @Builder.Default
    private boolean inApp = true;
}