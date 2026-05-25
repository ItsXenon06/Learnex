package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ProfileResponse {
    private UUID userId;
    private String email;
    private String displayName;
    private String headline;
    private String bio;
    private String website;
}