package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class StudyGroupResponse {

    private UUID    id;
    private String  name;
    private String  description;
    private String  type;
    private Boolean isPrivate;
    private Integer memberCount;

    private UUID    createdById;
    private String  createdByEmail;
    private String  createdByDisplayName;

    private LocalDateTime createdAt;

    private Boolean isMember;
    private String  myRole;   // ← ADD THIS: "owner" | "admin" | "moderator" | "member" | null
}