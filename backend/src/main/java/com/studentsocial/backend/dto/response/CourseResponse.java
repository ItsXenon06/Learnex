package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CourseResponse {
    private UUID   id;
    private String code;
    private String name;
    private String description;
    private String department;
    private int    enrolled;
    private String color;
    private String accent;
}