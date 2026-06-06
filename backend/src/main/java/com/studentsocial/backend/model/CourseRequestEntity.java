package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "course_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "course_name", nullable = false, length = 255)
    private String courseName; // Required: e.g., "Data Science 101"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason; // Required: Why this course is needed

    @Column(name = "course_code", nullable = true, length = 50)
    private String courseCode; // Optional: e.g., "CS302", "MATH401"

    @Column(name = "school_name", nullable = true, length = 255)
    private String schoolName; // Optional: e.g., "Stanford University", "MIT"

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "pending"; // pending | approved | rejected

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
