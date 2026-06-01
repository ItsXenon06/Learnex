package com.studentsocial.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CourseRequestDto{

    @NotBlank(message = "Course name is required")
    @Size(max = 255, message = "Course name must be 255 characters or fewer")
    private String courseName;

    @Size(max = 2000, message = "Reason must be 2000 characters or fewer")
    private String reason;
}