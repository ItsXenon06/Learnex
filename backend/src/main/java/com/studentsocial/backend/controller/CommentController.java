package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.request.CreateCommentRequest;
import com.studentsocial.backend.dto.request.ReactRequest;
import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.response.CommentResponse;
import com.studentsocial.backend.dto.response.ReactionSummaryResponse;
import com.studentsocial.backend.repository.UserRepository;
import com.studentsocial.backend.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    private UUID resolveUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();
    }

    // ── Get comments for a post ───────────────────────────────────────────
    // Public — no auth needed to read comments
    @GetMapping("/api/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(
            @PathVariable UUID postId) {

        return ResponseEntity.ok(ApiResponse.success(commentService.getComments(postId)));
    }

    // ── Create comment ────────────────────────────────────────────────────
    // BUG FIX: CommentService.createComment was reading userId from request.getUserId()
    // (set by the client). Now we overwrite it with the JWT-resolved userId,
    // so the actual authenticated user is always the comment author.
    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @PathVariable UUID postId,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateCommentRequest request) {

        // Force the userId to the authenticated user — ignore what the client sent.
        request.setUserId(resolveUserId(principal));
        return ResponseEntity.ok(ApiResponse.success(commentService.createComment(postId, request)));
    }

    // ── Delete comment ────────────────────────────────────────────────────
    // BUG FIX: was @RequestParam UUID userId — now from JWT.
    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserDetails principal) {

        commentService.deleteComment(commentId, resolveUserId(principal));
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── Comment reactions ─────────────────────────────────────────────────
    @PostMapping("/api/comments/{commentId}/reactions")
    public ResponseEntity<ApiResponse<List<ReactionSummaryResponse>>> reactToComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody ReactRequest request) {

        request.setUserId(resolveUserId(principal));
        return ResponseEntity.ok(ApiResponse.success(commentService.reactToComment(commentId, request)));
    }

    @DeleteMapping("/api/comments/{commentId}/reactions")
    public ResponseEntity<ApiResponse<List<ReactionSummaryResponse>>> removeCommentReaction(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(ApiResponse.success(
                commentService.removeCommentReaction(commentId, resolveUserId(principal))));
    }
}