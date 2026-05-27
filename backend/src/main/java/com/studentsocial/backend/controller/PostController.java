package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.request.CreatePostRequest;
import com.studentsocial.backend.dto.request.ReactRequest;
import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.response.PostResponse;
import com.studentsocial.backend.dto.response.ReactionSummaryResponse;
import com.studentsocial.backend.repository.UserRepository;
import com.studentsocial.backend.service.PostReactionService;
import com.studentsocial.backend.service.PostService;
import com.studentsocial.backend.service.SavedPostService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService         postService;
    private final PostReactionService postReactionService;
    private final UserRepository      userRepository;

    // ── Resolve the UUID of the currently authenticated user ──────────────
    // Spring Security gives us a UserDetails whose username is the email
    // (set in CustomerUserDetailsService). We look up the UUID from that.
    private UUID resolveUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();
    }

    // ── Create post ───────────────────────────────────────────────────────
    // BUG FIX: was @RequestParam UUID authorId — anyone could forge a userId.
    // Now the authorId comes from the JWT principal only.
    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreatePostRequest request) {

        UUID authorId = resolveUserId(principal);
        PostResponse post = postService.createPost(authorId, request);
        return ResponseEntity.ok(ApiResponse.success(post));
    }

    // ── Get single post ───────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(postService.getPost(id)));
    }

    // ── Delete post ───────────────────────────────────────────────────────
    // BUG FIX: was @RequestParam UUID userId — now from JWT.
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {

        postService.deletePost(id, resolveUserId(principal));
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── Feed (following + own posts) ──────────────────────────────────────
    // BUG FIX: userId was a raw @RequestParam — forged-able and redundant
    // since the token already tells us who the user is.
    // Also fixed: own posts are now included so a newly created post
    // appears in the author's feed immediately.
    @GetMapping("/feed")
public ResponseEntity<ApiResponse<List<PostResponse>>> getFeed(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam(defaultValue = "0")      int    page,
        @RequestParam(defaultValue = "20")     int    size,
        @RequestParam(defaultValue = "latest") String sort,
        @RequestParam(defaultValue = "24h")    String window) {  // 24h | 30d | 365d
 
    UUID userId = resolveUserId(principal);
    List<PostResponse> posts;
    if ("likes".equals(sort)) {
        String interval = switch (window) {
            case "30d"  -> "30 days";
            case "365d" -> "365 days";
            default     -> "24 hours";
        };
        posts = postService.getFeedSortedByLikes(userId, interval, page, size);
    } else {
        posts = postService.getFeed(userId, page, size);
    }
    return ResponseEntity.ok(ApiResponse.success(posts));
}
 
// ── Discover (public posts) with optional sort ────────────────────────────
@GetMapping("/discover")
public ResponseEntity<ApiResponse<List<PostResponse>>> getDiscover(
        @RequestParam(defaultValue = "0")      int    page,
        @RequestParam(defaultValue = "20")     int    size,
        @RequestParam(defaultValue = "latest") String sort,
        @RequestParam(defaultValue = "24h")    String window) {
 
    List<PostResponse> posts;
    if ("likes".equals(sort)) {
        String interval = switch (window) {
            case "30d"  -> "30 days";
            case "365d" -> "365 days";
            default     -> "24 hours";
        };
        posts = postService.getDiscoverSortedByLikes(interval, page, size);
    } else {
        posts = postService.getDiscover(page, size);
    }
    return ResponseEntity.ok(ApiResponse.success(posts));
}

    // ── Reactions ─────────────────────────────────────────────────────────
    // BUG FIX: these endpoints were MISSING — the frontend called
    // POST /api/posts/{id}/reactions and DELETE /api/posts/{id}/reactions
    // but no controller handled them, so every like silently 404'd.

    @PostMapping("/{id}/reactions")
    public ResponseEntity<ApiResponse<List<ReactionSummaryResponse>>> react(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody ReactRequest request) {

        // Override whatever userId the client sent — use the token instead.
        request.setUserId(resolveUserId(principal));
        return ResponseEntity.ok(ApiResponse.success(postReactionService.react(id, request)));
    }

    @DeleteMapping("/{id}/reactions")
    public ResponseEntity<ApiResponse<List<ReactionSummaryResponse>>> removeReaction(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.success(postReactionService.removeReaction(id, userId)));
    }

    @GetMapping("/{id}/reactions")
    public ResponseEntity<ApiResponse<List<ReactionSummaryResponse>>> getReactions(
            @PathVariable UUID id) {

        return ResponseEntity.ok(ApiResponse.success(postReactionService.getReactionSummary(id)));
    }
    @GetMapping("/users/{userId}/posts")
// NOTE: this goes in UserController or PostController — pick one and be consistent.
// Recommended: UserController since it's a user-scoped resource.
public ResponseEntity<ApiResponse<List<PostResponse>>> getUserPosts(
        @PathVariable UUID userId,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size) {

    return ResponseEntity.ok(ApiResponse.success(postService.getUserPosts(userId, page, size)));
}
private final SavedPostService savedPostService; // add to @RequiredArgsConstructor field list

// POST /api/posts/{id}/save
@PostMapping("/{id}/save")
public ResponseEntity<ApiResponse<Void>> savePost(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserDetails principal) {

    UUID userId = resolveUserId(principal);
    savedPostService.savePost(userId, id);
    return ResponseEntity.ok(ApiResponse.success(null));
}

// DELETE /api/posts/{id}/save
@DeleteMapping("/{id}/save")
public ResponseEntity<ApiResponse<Void>> unsavePost(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserDetails principal) {

    UUID userId = resolveUserId(principal);
    savedPostService.unsavePost(userId, id);
    return ResponseEntity.ok(ApiResponse.success(null));
}
}