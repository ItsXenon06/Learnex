package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for StudyGroup responses.
 *
 * ROOT CAUSE OF THE 500 ERROR:
 * GroupController was returning StudyGroup entities directly. StudyGroup has
 * several @ManyToOne(fetch = FetchType.LAZY) fields (createdBy, school, section,
 * coverMedia). When Jackson tries to serialize an uninitialized Hibernate proxy
 * it hits ByteBuddyInterceptor and throws:
 *   "No serializer found for class ByteBuddyInterceptor"
 *
 * Fix: map to this DTO inside the transaction (while the session is still open),
 * then return the DTO. The controller/service now never returns a raw entity.
 */
@Data
@Builder
public class StudyGroupResponse {

    private UUID    id;
    private String  name;
    private String  description;
    private String  type;           // general | class | club | society
    private Boolean isPrivate;
    private Integer memberCount;

    // Creator info — only the fields the frontend needs
    private UUID    createdById;
    private String  createdByEmail;
    private String  createdByDisplayName;

    private LocalDateTime createdAt;

    // Whether the requesting user is already a member (set by GroupService)
    private boolean isMember;
}