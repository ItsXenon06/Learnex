package com.studentsocial.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CourseRequestDto {

    @NotBlank(message = "Course name is required")
    @Size(max = 255, message = "Course name must be 255 characters or fewer")
    private String courseName; // Required

    @NotBlank(message = "Reason is required")
    @Size(max = 2000, message = "Reason must be 2000 characters or fewer")
    private String reason; // Required

    @Size(max = 50, message = "Course code must be 50 characters or fewer")
    private String courseCode; // Optional: e.g., "CS302", "MATH401"

    @Size(max = 255, message = "School name must be 255 characters or fewer")
    private String schoolName; // Optional: e.g., "Stanford University"
}
