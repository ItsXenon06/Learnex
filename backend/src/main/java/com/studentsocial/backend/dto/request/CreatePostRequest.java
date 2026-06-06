package com.studentsocial.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class CreatePostRequest {
    private UUID groupId;      // For group forum posts
    private UUID courseId;     // For course forum posts
    
    private String content;
    private String visibility = "public";
    
    private List<UUID> mediaIds;
}
