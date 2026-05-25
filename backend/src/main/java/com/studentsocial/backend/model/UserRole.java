package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_role")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "scope_type", nullable = false, length = 20)
    private String scopeType; // 'global' | 'school' | 'group'

    @Column(name = "scope_id")
    private UUID scopeId; // NULL for global, school/group UUID otherwise

    @Column(name = "granted_at", nullable = false, updatable = false)
    private LocalDateTime grantedAt;

    @PrePersist
    protected void onCreate() {
        if (grantedAt == null) {
            grantedAt = LocalDateTime.now();
        }
        if (scopeType == null) { // Set default if not explicitly provided
            scopeType = "global";
        }
        validateScope();
    }

    @PreUpdate
    protected void onUpdate() {
        validateScope();
    }

    private void validateScope() {
        if ("global".equals(scopeType)) {
            if (scopeId != null) {
                throw new IllegalStateException("For 'global' scopeType, scopeId must be NULL.");
            }
        } else if ("school".equals(scopeType) || "group".equals(scopeType)) {
            if (scopeId == null) {
                throw new IllegalStateException("For 'school' or 'group' scopeType, scopeId must not be NULL.");
            }
        } else {
            throw new IllegalStateException("Invalid scopeType: " + scopeType);
        }
    }
    // TODO: JPA does not directly support partial unique indexes.
    // The database (script.sql) enforces unique constraints based on scope_id being NULL or NOT NULL.
    // Specifically:
    // - UNIQUE INDEX uq_user_role_global ON user_role (user_id, role_id, scope_type) WHERE scope_id IS NULL;
    // - UNIQUE INDEX uq_user_role_scoped ON user_role (user_id, role_id, scope_type, scope_id) WHERE scope_id IS NOT NULL;
    // Application logic should rely on the database to enforce these unique constraints.
}
