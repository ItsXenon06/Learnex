package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.response.StudyGroupResponse;
import com.studentsocial.backend.model.*;
import com.studentsocial.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final StudyGroupRepository  studyGroupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupRoleRepository   groupRoleRepository;
    private final UserRepository        userRepository;
    private final ProfileRepository     profileRepository;

    // ── Resolve UUID from JWT ─────────────────────────────────────────────
    private UUID resolveUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();
    }

    // ── Map entity → DTO (must be called inside an open transaction) ──────
    // FIX: never return a raw StudyGroup entity — lazy proxies (createdBy,
    // school, section, coverMedia) crash Jackson with ByteBuddyInterceptor.
    private StudyGroupResponse toDto(StudyGroup g, UUID viewingUserId) {
        String displayName = null;
        if (g.getCreatedBy() != null) {
            displayName = profileRepository
                    .findByUserId(g.getCreatedBy().getId())
                    .map(Profile::getDisplayName)
                    .orElse(null);
        }

        boolean isMember = viewingUserId != null &&
                groupMemberRepository.existsByGroupIdAndUserId(g.getId(), viewingUserId);

        return StudyGroupResponse.builder()
                .id(g.getId())
                .name(g.getName())
                .description(g.getDescription())
                .type(g.getType())
                .isPrivate(g.getIsPrivate())
                .memberCount(g.getMemberCount())
                .createdById(g.getCreatedBy() != null ? g.getCreatedBy().getId() : null)
                .createdByEmail(g.getCreatedBy() != null ? g.getCreatedBy().getEmail() : null)
                .createdByDisplayName(displayName)
                .createdAt(g.getCreatedAt())
                .isMember(isMember)
                .build();
    }

    // ── GET /api/groups ───────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<List<StudyGroupResponse>>> getGroups(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "30") int size) {

        UUID viewerId = principal != null ? resolveUserId(principal) : null;
        List<StudyGroup> groups = studyGroupRepository
                .findAllByDeletedAtIsNullOrderByCreatedAtDesc(page * size, size);

        List<StudyGroupResponse> dtos = groups.stream()
                .map(g -> toDto(g, viewerId))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    // ── GET /api/groups/{id} ──────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudyGroupResponse>> getGroup(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {

        UUID viewerId = principal != null ? resolveUserId(principal) : null;
        StudyGroup group = studyGroupRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        return ResponseEntity.ok(ApiResponse.success(toDto(group, viewerId)));
    }

    // ── GET /api/users/me/groups ──────────────────────────────────────────
    // Returns groups the authenticated user belongs to.
    // NOTE: this endpoint lives here (not UserController) to keep group logic together.
    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<StudyGroupResponse>>> getMyGroups(
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);
        List<StudyGroup> groups = groupMemberRepository.findGroupsByUserId(userId);

        List<StudyGroupResponse> dtos = groups.stream()
                .map(g -> toDto(g, userId))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    // ── POST /api/groups ──────────────────────────────────────────────────
    // FIX: was returning raw StudyGroup entity → ByteBuddyInterceptor crash.
    // Now returns StudyGroupResponse DTO. Also: the crash was happening AFTER
    // the save, which is why groups appeared to not persist (they did save, but
    // the 500 response made the frontend think it failed).
    @PostMapping
    public ResponseEntity<ApiResponse<StudyGroupResponse>> createGroup(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {

        UUID userId = resolveUserId(principal);
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        StudyGroup group = StudyGroup.builder()
                .name((String) body.get("name"))
                .description((String) body.getOrDefault("description", ""))
                .type((String) body.getOrDefault("type", "club"))
                .isPrivate(Boolean.TRUE.equals(body.get("isPrivate")))
                .createdBy(creator)
                .memberCount(1)
                .build();

        StudyGroup saved = studyGroupRepository.save(group);

        // Add creator as owner
        GroupRole ownerRole = groupRoleRepository.findByName("owner")
                .orElseThrow(() -> new RuntimeException(
                        "Owner role not seeded — run script.sql first"));
        groupMemberRepository.save(GroupMember.builder()
                .group(saved)
                .user(creator)
                .role(ownerRole)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(toDto(saved, userId)));
    }

    // ── POST /api/groups/{id}/join ────────────────────────────────────────
    @PostMapping("/{id}/join")
    public ResponseEntity<ApiResponse<StudyGroupResponse>> joinGroup(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);

        if (groupMemberRepository.existsByGroupIdAndUserId(id, userId)) {
            StudyGroup group = studyGroupRepository.findByIdAndDeletedAtIsNull(id)
                    .orElseThrow(() -> new RuntimeException("Group not found"));
            return ResponseEntity.ok(ApiResponse.success(toDto(group, userId)));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        StudyGroup group = studyGroupRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        GroupRole memberRole = groupRoleRepository.findByName("member")
                .orElseThrow(() -> new RuntimeException("Member role not seeded"));

        groupMemberRepository.save(GroupMember.builder()
                .group(group)
                .user(user)
                .role(memberRole)
                .build());

        // member_count maintained by DB trigger
        return ResponseEntity.ok(ApiResponse.success(toDto(group, userId)));
    }

    // ── DELETE /api/groups/{id}/leave ─────────────────────────────────────
    @DeleteMapping("/{id}/leave")
public ResponseEntity<ApiResponse<Void>> leaveGroup(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserDetails principal) {

    UUID userId = resolveUserId(principal);

    // Guard: owner cannot leave — they must transfer ownership first
    groupMemberRepository.findByGroupId(id).stream()
            .filter(gm -> gm.getUser().getId().equals(userId))
            .findFirst()
            .ifPresent(gm -> {
                if ("owner".equals(gm.getRole().getName())) {
                    throw new IllegalArgumentException(
                            "Group owner cannot leave. Transfer ownership before leaving.");
                }
            });

    groupMemberRepository.deleteByGroupIdAndUserId(id, userId);
    return ResponseEntity.ok(ApiResponse.success(null));
}

    // ── GET /api/groups/{id}/members ──────────────────────────────────────
    // Returns member UUIDs + emails only — never raw entity with lazy proxies.
    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMembers(
            @PathVariable UUID id) {

        List<Map<String, Object>> members = groupMemberRepository.findByGroupId(id)
                .stream()
                .map(gm -> {
    Map<String, Object> m = new HashMap<>();
    m.put("userId",   gm.getUser().getId());
    m.put("email",    gm.getUser().getEmail());
    m.put("roleName", gm.getRole().getName());
    m.put("joinedAt", gm.getJoinedAt());
    // ADD displayName lookup:
    profileRepository.findByUserId(gm.getUser().getId())
        .ifPresent(p -> m.put("displayName", p.getDisplayName()));
    return m;
})

                .toList();

        return ResponseEntity.ok(ApiResponse.success(members));
    }
}