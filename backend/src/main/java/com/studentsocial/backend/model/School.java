package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "school")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    private SchoolType type;

    @Column(name = "domain_email", length = 100)
    private String domainEmail;

    @Column(length = 100)
    private String country;

    @Column(length = 100)
    private String city;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String website;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        validateDomainEmail();
    }

    @PreUpdate
    protected void onUpdate() {
        validateDomainEmail();
    }

    private void validateDomainEmail() {
        if (domainEmail != null && (domainEmail.contains("@") || !domainEmail.contains("."))) {
            throw new IllegalStateException("Invalid domain_email format: " + domainEmail + ". Must not contain '@' and must contain a '.'");
        }
        // TODO: JPA does not directly support partial unique indexes.
        // The database (script.sql) enforces a unique constraint on domain_email WHERE domain_email IS NOT NULL.
        // Application logic should be aware of this for uniqueness checks if not relying solely on DB errors.
    }
}