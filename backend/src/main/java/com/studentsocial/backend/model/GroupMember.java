package com.studentsocial.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FIX: @JsonIgnoreProperties on lazy associations prevents ByteBuddyInterceptor
 * crash when GroupController.getMembers() maps these to plain Maps.
 * The actual fix for groups list/create is the StudyGroupResponse DTO,
 * but this annotation is a safety net for any future endpoint that might
 * accidentally return a GroupMember entity directly.
 */
@Entity
@Table(name = "group_member")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private StudyGroup group;

    @ManyToOne(fetch = FetchType.EAGER)   // EAGER: always need user info
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)   // EAGER: always need role name
    @JoinColumn(name = "role_id", nullable = false)
    private GroupRole role;

    @Column(name = "joined_at", nullable = false)
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }
}