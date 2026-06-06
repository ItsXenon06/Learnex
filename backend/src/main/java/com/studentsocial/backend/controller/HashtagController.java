package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.response.PostResponse;
import com.studentsocial.backend.model.Hashtag;
import com.studentsocial.backend.model.Post;
import com.studentsocial.backend.repository.HashtagRepository;
import com.studentsocial.backend.repository.PostHashtagRepository;
import com.studentsocial.backend.repository.PostRepository;
import com.studentsocial.backend.repository.UserRepository;
import com.studentsocial.backend.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/hashtags")
@RequiredArgsConstructor
public class HashtagController {

    private final PostRepository postRepository;
    private final PostService postService;
    private final UserRepository userRepository;
    private final HashtagRepository hashtagRepository;
    private final PostHashtagRepository postHashtagRepository;

    private UUID resolveUserId(UserDetails p) {
        if (p == null) return null;
        return userRepository.findByEmail(p.getUsername())
                .map(u -> u.getId()).orElse(null);
    }

    // ── GET /api/hashtags/trending ────────────────────────────────────
    // Returns top trending hashtags (sorted by post count, newest first)
    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<String>>> getTrendingHashtags(
            @RequestParam(defaultValue = "5") int limit) {
        
        Pageable pageable = PageRequest.of(0, Math.min(limit, 50));
        List<String> trendingTags = hashtagRepository
                .findTrendingHashtags(pageable)
                .stream()
                .map(Hashtag::getTag)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(trendingTags));
    }

    // ── GET /api/hashtags/{tag}/posts ────────────────────────────────
    // Returns posts for a specific hashtag, paginated
    @GetMapping("/{tag}/posts")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> getPostsByHashtag(
            @PathVariable String tag,
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        UUID userId = resolveUserId(principal);
        Pageable pageable = PageRequest.of(page, size);
        
        Page<Post> posts = postHashtagRepository
                .findPostsByHashtag(tag.toLowerCase(), pageable);
        
        Page<PostResponse> responses = posts.map(p -> postService.mapToResponse(
                p,
                p.getAuthor(),
                p.getAuthor().getProfile().orElse(null),
                p.getComments(),
                0,
                false,
                p.getAttachments()
        ));
        
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
