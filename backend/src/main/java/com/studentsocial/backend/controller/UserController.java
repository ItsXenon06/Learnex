package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.request.UpdateProfileRequest;
import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.response.FollowResponse;
import com.studentsocial.backend.dto.response.PostResponse;
import com.studentsocial.backend.dto.response.ProfileResponse;
import com.studentsocial.backend.repository.GroupMemberRepository;
import com.studentsocial.backend.repository.SavedPostRepository;
import com.studentsocial.backend.repository.UserRepository;
import com.studentsocial.backend.service.PostService;
import com.studentsocial.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService    userService;
    private final SavedPostRepository savedPostRepository;
    private final UserRepository userRepository;
    private final PostService    postService;
    private final GroupMemberRepository   groupMemberRepository;
    // ── Resolve UUID from JWT principal ───────────────────────────────────
    private UUID resolveUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();
    }

    // ── GET /api/users/me  (must be declared before /{id} to avoid conflict) ──
    // Returns the profile of the currently logged-in user.
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> getMe(
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.success(userService.getProfile(userId)));
    }

    // ── GET /api/users/search?q=...  (also before /{id}) ──────────────────
    // Searches users by email prefix or display name.
    // Returns up to 20 results. Used by: DM modal, friend search, @mention.
    // q=    → search by name/email fragment
    // email= → exact email lookup for DM creation
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ProfileResponse>>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String email) {

        if (email != null && !email.isBlank()) {
            // Exact email lookup — used by DM modal to resolve email → userId
            return ResponseEntity.ok(ApiResponse.success(userService.searchByEmail(email)));
        }
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success(userService.search(q)));
        }
        return ResponseEntity.ok(ApiResponse.success(List.of()));
    }

    // ── GET /api/users/{id} ───────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getProfile(id)));
    }

    // ── PUT /api/users/me ─────────────────────────────────────────────────
    // BUG FIX: was PUT /{id} with id from the path — anyone could update anyone.
    // Now reads userId from JWT only.
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdateProfileRequest request) {

        UUID userId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.success(userService.updateProfile(userId, request)));
    }

    // ── POST /api/users/{id}/follow ───────────────────────────────────────
    // BUG FIX: was @RequestParam UUID currentUserId — now from JWT.
    @PostMapping("/{id}/follow")
    public ResponseEntity<ApiResponse<FollowResponse>> follow(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {

        UUID currentUserId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.success(userService.follow(currentUserId, id)));
    }

    // ── DELETE /api/users/{id}/follow ─────────────────────────────────────
    @DeleteMapping("/{id}/follow")
    public ResponseEntity<ApiResponse<FollowResponse>> unfollow(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {

        UUID currentUserId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.success(userService.unfollow(currentUserId, id)));
    }

    // ── GET /api/users/{id}/followers ─────────────────────────────────────
    @GetMapping("/{id}/followers")
    public ResponseEntity<ApiResponse<List<FollowResponse>>> getFollowers(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getFollowers(id)));
    }

    // ── GET /api/users/{id}/following ─────────────────────────────────────
    @GetMapping("/{id}/following")
    public ResponseEntity<ApiResponse<List<FollowResponse>>> getFollowing(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getFollowing(id)));
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<ApiResponse<List<PostResponse>>> getUserPosts(
        @PathVariable UUID id,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size) {

    return ResponseEntity.ok(ApiResponse.success(postService.getUserPosts(id, page, size)));
}
@GetMapping("/me/groups")
public ResponseEntity<ApiResponse<List<com.studentsocial.backend.model.StudyGroup>>> getMyGroups(
        @AuthenticationPrincipal UserDetails principal) {
    UUID userId = resolveUserId(principal);
    return ResponseEntity.ok(ApiResponse.success(
            groupMemberRepository.findGroupsByUserId(userId)));
}
// GET /api/users/me/saved-posts
// Returns all posts the authenticated user has saved, newest save first.
@GetMapping("/me/saved-posts")
public ResponseEntity<ApiResponse<List<PostResponse>>> getSavedPosts(
        @AuthenticationPrincipal UserDetails principal) {

    UUID userId = resolveUserId(principal);
    List<com.studentsocial.backend.model.Post> posts =
            savedPostRepository.findPostsByUserId(userId);
    // Re-use PostService's mapper — builds full PostResponse with reactions,
    // commentCount, saved=true (all of these are saved posts by definition).
    List<PostResponse> responses = posts.stream()
            .map(post -> postService.buildSinglePostResponse(post, userId))
            .toList();
    return ResponseEntity.ok(ApiResponse.success(responses));
}


}