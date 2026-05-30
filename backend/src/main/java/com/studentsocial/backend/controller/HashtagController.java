package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.response.PostResponse;
import com.studentsocial.backend.model.Post;
import com.studentsocial.backend.repository.PostRepository;
import com.studentsocial.backend.repository.UserRepository;
import com.studentsocial.backend.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/hashtags")
@RequiredArgsConstructor
public class HashtagController {

    private final PostRepository postRepository;
    private final PostService    postService;
    private final UserRepository userRepository;

    private UUID resolveUserId(UserDetails p) {
        if (p == null) return null;
        return userRepository.findByEmail(p.getUsername())
                .map(u -> u.getId()).orElse(null);
    }

    /**
     * GET /api/hashtags/{tag}/posts?page=0&size=20
     * Returns public posts whose content contains #tag (case-insensitive).
     * Falls back to ILIKE scan — good enough until a hashtag join table
     * is wired into PostService.
     */
    @GetMapping("/{tag}/posts")
    public ResponseEntity<ApiResponse<List<PostResponse>>> getHashtagPosts(
            @PathVariable String tag,
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID userId = resolveUserId(principal);
        List<Post> posts = postRepository.findByHashtag(
                tag.toLowerCase(), page * size, size);
        List<PostResponse> responses = postService.buildGroupPostResponses(posts, userId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}