package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.response.PostResponse;
import com.studentsocial.backend.model.GroupMember;
import com.studentsocial.backend.model.Post;
import com.studentsocial.backend.repository.*;
import com.studentsocial.backend.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Serves posts scoped to a specific study group.
 * GET /api/groups/{groupId}/posts
 */
@RestController
@RequiredArgsConstructor
public class GroupPostController {

    private final UserRepository        userRepository;
    private final StudyGroupRepository  studyGroupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final PostRepository        postRepository;
    private final PostService           postService;

    private UUID resolveUserId(UserDetails p) {
        return userRepository.findByEmail(p.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found")).getId();
    }

    /**
     * GET /api/groups/{groupId}/posts?page=0&size=20&sort=latest|likes
     * Returns posts whose group_id = groupId.
     * For private/class groups the caller must be a member.
     */
    @GetMapping("/api/groups/{groupId}/posts")
    public ResponseEntity<ApiResponse<List<PostResponse>>> getGroupPosts(
            @PathVariable UUID groupId,
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0")      int    page,
            @RequestParam(defaultValue = "20")     int    size,
            @RequestParam(defaultValue = "latest") String sort) {

        UUID userId = resolveUserId(principal);

        var group = studyGroupRepository.findByIdAndDeletedAtIsNull(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // For class groups (private by invite), check membership
        boolean isMember = groupMemberRepository.existsByGroupIdAndUserId(groupId, userId);
        if ("class".equals(group.getType()) && !isMember) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("You are not a member of this group"));
        }

        List<Post> posts = "likes".equals(sort)
                ? postRepository.findByGroupIdOrderByLikes(groupId, page * size, size)
                : postRepository.findByGroupIdOrderByCreatedAt(groupId, page * size, size);

        List<PostResponse> responses = postService.buildGroupPostResponses(posts, userId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}