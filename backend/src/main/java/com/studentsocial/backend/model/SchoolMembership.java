package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "school_membership")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(nullable = false, length = 50)
    private String role; // 'student' | 'faculty' | 'staff' | 'alumni'

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "pending"; // 'pending' | 'verified' | 'rejected'

    @Column(name = "proof_url", columnDefinition = "TEXT")
    private String proofUrl;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        validateRoleAndStatus();
    }

    @PreUpdate
    protected void onUpdate() {
        validateRoleAndStatus();
    }

    private void validateRoleAndStatus() {
        List<String> allowedRoles = Arrays.asList("student", "faculty", "staff", "alumni");
        if (!allowedRoles.contains(role)) {
            throw new IllegalStateException("Invalid role: " + role + ". Must be one of " + allowedRoles);
        }

        List<String> allowedStatuses = Arrays.asList("pending", "verified", "rejected");
        if (!allowedStatuses.contains(status)) {
            throw new IllegalStateException("Invalid status: " + status + ". Must be one of " + allowedStatuses);
        }
    }
}