package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CourseRequestResponse {
    private UUID          id;
    private String        courseName;
    private String        reason;
    private String        status;
    private LocalDateTime createdAt;
}