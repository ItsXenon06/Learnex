package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.request.UpdateMemberRoleRequest;
import com.studentsocial.backend.dto.response.StudyGroupResponse;
import com.studentsocial.backend.model.*;
import com.studentsocial.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;
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

    // ── Map entity → DTO ──────────────────────────────────────────────────
    private StudyGroupResponse toDto(StudyGroup g, UUID viewingUserId) {
        String displayName = null;
        if (g.getCreatedBy() != null) {
            displayName = profileRepository
                    .findByUserId(g.getCreatedBy().getId())
                    .map(Profile::getDisplayName)
                    .orElse(null);
        }

        boolean isMember = false;
        String  myRole   = null;

        if (viewingUserId != null) {
            for (GroupMember gm : groupMemberRepository.findByGroupId(g.getId())) {
                if (gm.getUser().getId().equals(viewingUserId)) {
                    isMember = true;
                    myRole   = gm.getRole().getName();
                    break;
                }
            }
        }

        // Extract to typed locals to satisfy @NonNull checker on builder
        UUID    createdById    = g.getCreatedBy() != null ? g.getCreatedBy().getId()    : null;
        String  createdByEmail = g.getCreatedBy() != null ? g.getCreatedBy().getEmail() : null;

        return StudyGroupResponse.builder()
                .id(g.getId())
                .name(g.getName())
                .description(g.getDescription())
                .type(g.getType())
                .isPrivate(g.getIsPrivate())
                .memberCount(g.getMemberCount())
                .createdById(createdById)
                .createdByEmail(createdByEmail)
                .createdByDisplayName(displayName)
                .createdAt(g.getCreatedAt())
                .isMember(isMember)
                .myRole(myRole)
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

    // ── GET /api/groups/mine ──────────────────────────────────────────────
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
                .memberCount(0)
                .build();

        StudyGroup saved = studyGroupRepository.save(group);

        GroupRole ownerRole = groupRoleRepository.findByName("owner")
                .orElseThrow(() -> new RuntimeException("Owner role not seeded — run script.sql first"));

        groupMemberRepository.save(GroupMember.builder()
                .group(saved)
                .user(creator)
                .role(ownerRole)
                .build());

        // Re-fetch so memberCount reflects the DB trigger update (0 → 1)
        UUID savedId = saved.getId();
        StudyGroup refreshed = studyGroupRepository.findById(savedId)
                .orElse(saved);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(toDto(refreshed, userId)));
    }

    // ── POST /api/groups/{id}/join ────────────────────────────────────────
    @PostMapping("/{id}/join")
    public ResponseEntity<ApiResponse<StudyGroupResponse>> joinGroup(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);

        StudyGroup group = studyGroupRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (groupMemberRepository.existsByGroupIdAndUserId(id, userId)) {
            return ResponseEntity.ok(ApiResponse.success(toDto(group, userId)));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        GroupRole memberRole = groupRoleRepository.findByName("member")
                .orElseThrow(() -> new RuntimeException("Member role not seeded"));

        groupMemberRepository.save(GroupMember.builder()
                .group(group)
                .user(user)
                .role(memberRole)
                .build());

        // Re-fetch so memberCount reflects the DB trigger update
        StudyGroup refreshed = studyGroupRepository.findByIdAndDeletedAtIsNull(id)
                .orElse(group);

        return ResponseEntity.ok(ApiResponse.success(toDto(refreshed, userId)));
    }

    // ── DELETE /api/groups/{id}/leave ─────────────────────────────────────
    // If the leaving user is the owner, auto-promote:
    //   1. Earliest admin (by joinedAt) → promoted to owner
    //   2. If no admins, earliest plain member → promoted to owner
    //   3. If no other members at all → soft-delete the group (no one left)
    // Note: only consider members who are still in the group (member count > 1 before deletion)
    @DeleteMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);
        if (userId == null) {
            throw new IllegalArgumentException("User not authenticated");
        }

        StudyGroup group = studyGroupRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        List<GroupMember> allMembers = groupMemberRepository.findByGroupId(id);
        
        GroupMember membership = allMembers.stream()
                .filter(gm -> gm.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        // If leaving user is owner, handle succession
        if ("owner".equals(membership.getRole().getName())) {
            // Try to find succession candidate: earliest admin first, then earliest member
            // Only consider members OTHER THAN the one leaving
            Optional<GroupMember> successor =
                    groupMemberRepository.findEarliestByGroupIdAndRole(id, userId, "admin");

            if (successor.isEmpty()) {
                successor = groupMemberRepository.findEarliestByGroupIdAndRole(id, userId, "member");
            }

            if (successor.isPresent()) {
                // Promote successor to owner before the current owner leaves
                GroupRole ownerRole = groupRoleRepository.findByName("owner")
                        .orElseThrow(() -> new IllegalArgumentException("Owner role not found in database"));
                GroupMember next = successor.get();
                next.setRole(ownerRole);
                groupMemberRepository.save(next);
            } else {
                // No other members — soft-delete the group
                group.setDeletedAt(LocalDateTime.now());
                studyGroupRepository.save(group);
            }
        }

        // Remove the leaving member
        groupMemberRepository.deleteByGroupIdAndUserId(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── GET /api/groups/{id}/members ──────────────────────────────────────
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
                    profileRepository.findByUserId(gm.getUser().getId())
                            .ifPresent(p -> m.put("displayName", p.getDisplayName()));
                    return m;
                })
                .toList();

        return ResponseEntity.ok(ApiResponse.success(members));
    }

    // ── PUT /api/groups/{id}/members/{targetUserId}/role ──────────────────
    @PutMapping("/{id}/members/{targetUserId}/role")
    public ResponseEntity<ApiResponse<Void>> updateMemberRole(
            @PathVariable UUID id,
            @PathVariable UUID targetUserId,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {

        UUID   callerId    = resolveUserId(principal);
        String newRoleName = (String) body.get("role");

        if (newRoleName == null || newRoleName.isBlank()) {
            throw new IllegalArgumentException("role is required");
        }

        List<GroupMember> allMembers = groupMemberRepository.findByGroupId(id);

        GroupMember callerMembership = allMembers.stream()
                .filter(gm -> gm.getUser().getId().equals(callerId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        String callerRole = callerMembership.getRole().getName();
        if (!"owner".equals(callerRole) && !"admin".equals(callerRole)) {
            throw new IllegalArgumentException("Only owners and admins can change roles");
        }

        if ("owner".equals(newRoleName) && !"owner".equals(callerRole)) {
            throw new IllegalArgumentException("Only the owner can transfer ownership");
        }

        GroupMember target = allMembers.stream()
                .filter(gm -> gm.getUser().getId().equals(targetUserId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Target user is not a member"));

        // Admins cannot act on other admins or the owner
        if (!"owner".equals(callerRole)) {
            String targetCurrentRole = target.getRole().getName();
            if ("owner".equals(targetCurrentRole) || "admin".equals(targetCurrentRole)) {
                throw new IllegalArgumentException("Admins can only manage plain members");
            }
        }

        GroupRole newRole = groupRoleRepository.findByName(newRoleName)
                .orElseThrow(() -> new IllegalArgumentException("Invalid role: " + newRoleName));

        // Ownership transfer: demote caller to admin first
        if ("owner".equals(newRoleName)) {
            GroupRole adminRole = groupRoleRepository.findByName("admin")
                    .orElseThrow(() -> new RuntimeException("Admin role not seeded"));
            callerMembership.setRole(adminRole);
            groupMemberRepository.save(callerMembership);
        }

        target.setRole(newRole);
        groupMemberRepository.save(target);

        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── DELETE /api/groups/{id} ───────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);

        StudyGroup group = studyGroupRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        GroupMember membership = groupMemberRepository.findByGroupId(id).stream()
                .filter(gm -> gm.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!"owner".equals(membership.getRole().getName())) {
            throw new IllegalArgumentException("Only the group owner can delete the group");
        }

        group.setDeletedAt(LocalDateTime.now());
        studyGroupRepository.save(group);

        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── PUT /api/groups/{id}/members/{memberId}/role ─────────────────────
    // Only owner can promote/demote members to admin or back to member
    // Admin role acts as "vice-admin" and will inherit ownership if owner leaves
    @PutMapping("/{id}/members/{memberId}/role")
    public ResponseEntity<ApiResponse<Void>> updateMemberRole(
            @PathVariable UUID id,
            @PathVariable UUID memberId,
            @RequestBody UpdateMemberRoleRequest request,
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);
        if (userId == null) {
            throw new IllegalArgumentException("User not authenticated");
        }

        StudyGroup group = studyGroupRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // Verify requester is owner
        GroupMember requester = groupMemberRepository.findByGroupId(id).stream()
                .filter(gm -> gm.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!"owner".equals(requester.getRole().getName())) {
            throw new IllegalArgumentException("Only the group owner can update member roles");
        }

        // Get the member to update
        GroupMember targetMember = groupMemberRepository.findByGroupId(id).stream()
                .filter(gm -> gm.getUser().getId().equals(memberId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Member not found in this group"));

        // Validate role name
        String roleName = request.getRoleName();
        if (!roleName.matches("admin|moderator|member")) {
            throw new IllegalArgumentException("Invalid role. Must be 'admin', 'moderator', or 'member'");
        }

        // Can't demote owner
        if ("owner".equals(targetMember.getRole().getName())) {
            throw new IllegalArgumentException("Cannot change the role of the group owner");
        }

        // Get and set the new role
        GroupRole newRole = groupRoleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName));
        targetMember.setRole(newRole);
        groupMemberRepository.save(targetMember);

        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
