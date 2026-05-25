package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class FollowResponse {

    // Used for follow/unfollow action responses
    private Boolean following;

    // Used for follower/following list responses
    // MD-1 FIX: displayName was never in this DTO — field added and now populated
    // via batch profile load in UserService.getFollowers/getFollowing.
    private UUID userId;
    private String email;
    private String displayName;
}