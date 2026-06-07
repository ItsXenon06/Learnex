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
import org.springframework.transaction.annotation.Transactional;
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
            try {
                var memberOpt = groupMemberRepository.findByGroupIdAndUserId(g.getId(), viewingUserId);
                if (memberOpt.isPresent()) {
                    isMember = true;
                    myRole = memberOpt.get().getRole().getName();
                }
            } catch (Exception e) {
                // If query fails, default to not member
                isMember = false;
                myRole = null;
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

    // ── POST /api/groups/{id}/join ────────────────���───────────────────────
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
    // If the leaving user is the owner, auto-promote in this order:
    //   1. Earliest admin (by joinedAt) → promoted to owner
    //   2. If no admins, earliest plain member → promoted to owner
    //   3. If no other members at all → soft-delete the group (no one left)
    @Transactional
    @DeleteMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);
        System.out.println("[v0] leaveGroup called: userId=" + userId + ", groupId=" + id);

        GroupMember membership = groupMemberRepository.findByGroupId(id).stream()
                .filter(gm -> gm.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        String memberRole = membership.getRole().getName();
        System.out.println("[v0] User role: " + memberRole);

        if ("owner".equals(memberRole)) {
            System.out.println("[v0] User is owner, finding successor...");
            
            // Try to find the earliest admin first
            Optional<GroupMember> adminSuccessor = 
                    groupMemberRepository.findEarliestAdminByGroupId(id, userId);

            if (adminSuccessor.isPresent()) {
                System.out.println("[v0] Found admin successor: " + adminSuccessor.get().getUser().getId());
                GroupRole ownerRole = groupRoleRepository.findByName("owner")
                        .orElseThrow(() -> new RuntimeException("Owner role not seeded"));
                GroupMember next = adminSuccessor.get();
                next.setRole(ownerRole);
                groupMemberRepository.save(next);
                System.out.println("[v0] Admin promoted to owner");
            } else {
                // No admins, try to find the earliest member
                Optional<GroupMember> memberSuccessor = 
                        groupMemberRepository.findEarliestMemberByGroupId(id, userId);

                if (memberSuccessor.isPresent()) {
                    System.out.println("[v0] Found member successor: " + memberSuccessor.get().getUser().getId());
                    GroupRole ownerRole = groupRoleRepository.findByName("owner")
                            .orElseThrow(() -> new RuntimeException("Owner role not seeded"));
                    GroupMember next = memberSuccessor.get();
                    next.setRole(ownerRole);
                    groupMemberRepository.save(next);
                    System.out.println("[v0] Member promoted to owner");
                } else {
                    // No other members — soft-delete the group
                    System.out.println("[v0] No successor found, deleting group");
                    StudyGroup group = studyGroupRepository.findByIdAndDeletedAtIsNull(id)
                            .orElseThrow(() -> new RuntimeException("Group not found"));
                    group.setDeletedAt(LocalDateTime.now());
                    studyGroupRepository.save(group);
                    System.out.println("[v0] Group soft-deleted");
                }
            }
        }

        groupMemberRepository.deleteByGroupIdAndUserId(id, userId);
        System.out.println("[v0] User removed from group");
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
    // Role assignment rules:
    // - Only owner can assign/change "owner" and "admin" roles
    // - Owner and admin can assign "moderator" role (unlimited)
    // - Admin can only manage plain members and moderators (not other admins or owner)
    // - Enforce max 1 admin per group
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

        if (!("member".equals(newRoleName) || "admin".equals(newRoleName) || 
              "moderator".equals(newRoleName) || "owner".equals(newRoleName))) {
            throw new IllegalArgumentException("Invalid role: " + newRoleName);
        }

        List<GroupMember> allMembers = groupMemberRepository.findByGroupId(id);

        GroupMember callerMembership = allMembers.stream()
                .filter(gm -> gm.getUser().getId().equals(callerId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        String callerRole = callerMembership.getRole().getName();
        
        // Only owner and admin can manage roles
        if (!"owner".equals(callerRole) && !"admin".equals(callerRole)) {
            throw new IllegalArgumentException("Only owners and admins can change member roles");
        }

        // Only owner can assign owner or admin roles
        if (("owner".equals(newRoleName) || "admin".equals(newRoleName)) && 
            !"owner".equals(callerRole)) {
            throw new IllegalArgumentException("Only the owner can assign owner/admin roles");
        }

        // Enforce max 1 admin per group (if assigning admin role)
        if ("admin".equals(newRoleName)) {
            long adminCount = allMembers.stream()
                    .filter(gm -> "admin".equals(gm.getRole().getName()))
                    .count();
            if (adminCount > 0) {
                throw new IllegalArgumentException("Group can only have 1 admin. Remove current admin first.");
            }
        }

        // Admins cannot act on other admins or the owner
        if (!"owner".equals(callerRole)) {
            GroupMember target = allMembers.stream()
                    .filter(gm -> gm.getUser().getId().equals(targetUserId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Target user is not a member"));
            
            String targetCurrentRole = target.getRole().getName();
            if ("owner".equals(targetCurrentRole) || "admin".equals(targetCurrentRole)) {
                throw new IllegalArgumentException("Admins can only manage plain members and moderators");
            }
        }

        GroupMember target = allMembers.stream()
                .filter(gm -> gm.getUser().getId().equals(targetUserId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Target user is not a member"));

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

    // ── DELETE /api/groups/{id}/members/{targetUserId} ───────────────────
    // Remove a member from the group
    // Owner can remove anyone
    // Admin can remove plain members and moderators (not owner or other admin)
    @DeleteMapping("/{id}/members/{targetUserId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID id,
            @PathVariable UUID targetUserId,
            @AuthenticationPrincipal UserDetails principal) {

        UUID callerId = resolveUserId(principal);
        
        if (callerId.equals(targetUserId)) {
            throw new IllegalArgumentException("Use /leave endpoint to leave the group yourself");
        }

        List<GroupMember> allMembers = groupMemberRepository.findByGroupId(id);

        GroupMember callerMembership = allMembers.stream()
                .filter(gm -> gm.getUser().getId().equals(callerId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        String callerRole = callerMembership.getRole().getName();
        
        // Only owner and admin can remove members
        if (!"owner".equals(callerRole) && !"admin".equals(callerRole)) {
            throw new IllegalArgumentException("Only owners and admins can remove members");
        }

        GroupMember target = allMembers.stream()
                .filter(gm -> gm.getUser().getId().equals(targetUserId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Target user is not a member"));

        // Admins cannot remove owner or other admins
        if (!"owner".equals(callerRole)) {
            String targetRole = target.getRole().getName();
            if ("owner".equals(targetRole) || "admin".equals(targetRole)) {
                throw new IllegalArgumentException("Admins can only remove plain members and moderators");
            }
        }

        groupMemberRepository.deleteByGroupIdAndUserId(id, targetUserId);
        
        // Decrement member count
        StudyGroup group = studyGroupRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
        studyGroupRepository.save(group);

        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── DELETE /api/groups/{id} ───────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {

        UUID userId = resolveUserId(principal);
        System.out.println("[v0] deleteGroup called: userId=" + userId + ", groupId=" + id);

        StudyGroup group = studyGroupRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        GroupMember membership = groupMemberRepository.findByGroupId(id).stream()
                .filter(gm -> gm.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        String memberRole = membership.getRole().getName();
        System.out.println("[v0] Delete attempt - User role: " + memberRole);

        if (!"owner".equals(memberRole)) {
            System.out.println("[v0] User is not owner, denying delete");
            throw new IllegalArgumentException("Only the group owner can delete the group");
        }

        group.setDeletedAt(LocalDateTime.now());
        studyGroupRepository.save(group);
        System.out.println("[v0] Group deleted successfully");

        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
