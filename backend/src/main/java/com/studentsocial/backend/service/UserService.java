package com.studentsocial.backend.service;

import com.studentsocial.backend.dto.request.UpdateProfileRequest;
import com.studentsocial.backend.dto.response.FollowResponse;
import com.studentsocial.backend.dto.response.ProfileResponse;
import com.studentsocial.backend.exception.ResourceNotFoundException;
import com.studentsocial.backend.model.Follow;
import com.studentsocial.backend.model.Profile;
import com.studentsocial.backend.model.User;
import com.studentsocial.backend.repository.FollowRepository;
import com.studentsocial.backend.repository.ProfileRepository;
import com.studentsocial.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository     userRepository;
    private final ProfileRepository  profileRepository;
    private final FollowRepository   followRepository;
    private final NotificationService notificationService;

    // ── Search ────────────────────────────────────────────────────────────

    /**
     * General search: matches email or display name fragment (case-insensitive).
     * Used by: friend search UI, @mention autocomplete, DM user lookup.
     * Returns up to 20 results, profiles batch-loaded in one query.
     */
    @Transactional(readOnly = true)
    public List<ProfileResponse> search(String q) {
        if (q == null || q.isBlank()) return List.of();
        List<User> users = userRepository.searchByEmailOrDisplayName(q.trim());
        return buildProfileResponses(users);
    }

    /**
     * Exact email lookup — used by DM modal to resolve an email to a UUID.
     * Returns a single-element list (or empty) so the controller API is uniform.
     */
    @Transactional(readOnly = true)
    public List<ProfileResponse> searchByEmail(String email) {
        return userRepository.findActiveByEmail(email)
                .map(user -> {
                    Profile profile = profileRepository.findByUserId(user.getId()).orElse(null);
                    return List.of(toProfileResponse(user, profile));
                })
                .orElse(List.of());
    }

    // ── Follow / Unfollow ─────────────────────────────────────────────────

    @Transactional
    public FollowResponse follow(UUID currentUserId, UUID targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }
        if (followRepository.existsByFollowerIdAndFolloweeId(currentUserId, targetUserId)) {
            throw new IllegalArgumentException("Already following this user");
        }

        User follower = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User followee = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        followRepository.save(Follow.builder().follower(follower).followee(followee).build());

        String actorName = profileRepository.findByUserId(currentUserId)
                .map(p -> p.getDisplayName() != null ? p.getDisplayName() : follower.getEmail())
                .orElse(follower.getEmail());
        notificationService.sendFollow(targetUserId, currentUserId, actorName);

        return FollowResponse.builder().following(true).build();
    }

    @Transactional
    public FollowResponse unfollow(UUID currentUserId, UUID targetUserId) {
        Follow follow = followRepository.findByFollowerIdAndFolloweeId(currentUserId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Not following this user"));
        followRepository.delete(follow);
        return FollowResponse.builder().following(false).build();
    }

    // ── Followers / Following lists ───────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FollowResponse> getFollowers(UUID userId) {
        List<User> users = followRepository.findFollowersByUserId(userId);
        Map<UUID, String> displayNames = batchLoadDisplayNames(users);
        return users.stream()
                .map(u -> FollowResponse.builder()
                        .userId(u.getId())
                        .email(u.getEmail())
                        .displayName(displayNames.getOrDefault(u.getId(), null))
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FollowResponse> getFollowing(UUID userId) {
        List<User> users = followRepository.findFollowingByUserId(userId);
        Map<UUID, String> displayNames = batchLoadDisplayNames(users);
        return users.stream()
                .map(u -> FollowResponse.builder()
                        .userId(u.getId())
                        .email(u.getEmail())
                        .displayName(displayNames.getOrDefault(u.getId(), null))
                        .build())
                .toList();
    }

    // ── Profile ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Profile profile = profileRepository.findByUserId(userId).orElse(null);
        return toProfileResponse(user, profile);
    }

    @Transactional
    public ProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Profile profile = profileRepository.findByUserId(userId)
                .orElse(Profile.builder().user(user).build());

        if (request.getDisplayName() != null) profile.setDisplayName(request.getDisplayName());
        if (request.getHeadline()    != null) profile.setHeadline(request.getHeadline());
        if (request.getBio()         != null) profile.setBio(request.getBio());
        if (request.getWebsite()     != null) profile.setWebsite(request.getWebsite());
        if (request.getAvatarUrl() != null) {
    profile.setAvatarUrl(request.getAvatarUrl().isBlank() ? null : request.getAvatarUrl().trim());
}

        profileRepository.save(profile);
        return toProfileResponse(user, profile);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * Build ProfileResponse list from a User list, batch-loading profiles
     * in a single query to avoid N+1.
     */
    private List<ProfileResponse> buildProfileResponses(List<User> users) {
        if (users.isEmpty()) return List.of();
        List<UUID> ids = users.stream().map(User::getId).toList();
        Map<UUID, Profile> profileMap = profileRepository.findByUserIdIn(ids).stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p));
        return users.stream()
                .map(u -> toProfileResponse(u, profileMap.get(u.getId())))
                .toList();
    }

    private Map<UUID, String> batchLoadDisplayNames(List<User> users) {
        if (users.isEmpty()) return Map.of();
        List<UUID> ids = users.stream().map(User::getId).toList();
        return profileRepository.findByUserIdIn(ids).stream()
                .collect(Collectors.toMap(
                        p -> p.getUser().getId(),
                        p -> p.getDisplayName() != null ? p.getDisplayName() : ""));
    }

    private ProfileResponse toProfileResponse(User user, Profile profile) {
        return ProfileResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .displayName(profile != null ? profile.getDisplayName() : null)
                .headline(profile != null ? profile.getHeadline() : null)
                .bio(profile != null ? profile.getBio() : null)
                .website(profile != null ? profile.getWebsite() : null)
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .build();
    }
}