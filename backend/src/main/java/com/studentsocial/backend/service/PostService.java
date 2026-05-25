package com.studentsocial.backend.service;

import com.studentsocial.backend.dto.request.CreatePostRequest;
import com.studentsocial.backend.dto.response.PostResponse;
import com.studentsocial.backend.dto.response.ReactionSummaryResponse;
import com.studentsocial.backend.exception.ResourceNotFoundException;
import com.studentsocial.backend.exception.UnauthorizedException;
import com.studentsocial.backend.model.Post;
import com.studentsocial.backend.model.Profile;
import com.studentsocial.backend.model.User;
import com.studentsocial.backend.repository.CommentRepository;
import com.studentsocial.backend.repository.SavedPostRepository;
import com.studentsocial.backend.repository.FollowRepository;
import com.studentsocial.backend.repository.PostReactionRepository;
import com.studentsocial.backend.repository.PostRepository;
import com.studentsocial.backend.repository.ProfileRepository;
import com.studentsocial.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository         postRepository;
    private final UserRepository         userRepository;
    private final FollowRepository       followRepository;
    private final ProfileRepository      profileRepository;
    private final PostReactionRepository postReactionRepository;
    private final CommentRepository      commentRepository;
    // SavedPostRepository is used for saved-post lookups (saved_post table).
    // If your saved_post has its own repository, substitute it here.
    private final SavedPostRepository     savedPostRepository;

    // ── Create ────────────────────────────────────────────────────────────
    @Transactional
    public PostResponse createPost(UUID authorId, CreatePostRequest request) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Post post = postRepository.save(Post.builder()
                .author(author)
                .content(request.getContent())
                .visibility(request.getVisibility() != null ? request.getVisibility() : "public")
                .build());

        Profile profile = profileRepository.findByUserId(authorId).orElse(null);
        // New post: 0 comments, not saved, reactions empty
        return mapToResponse(post, author, profile, List.of(), 0, false);
    }

    // ── Single post ───────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PostResponse getPost(UUID postId) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        Profile profile = profileRepository.findByUserId(post.getAuthor().getId()).orElse(null);
        List<ReactionSummaryResponse> reactions = buildReactionSummary(
                postReactionRepository.countByReactionTypeForPost(postId));
        int commentCount = commentRepository.countByPostIdAndDeletedAtIsNull(postId);
        return mapToResponse(post, post.getAuthor(), profile, reactions, commentCount, false);
    }

    // ── Delete ────────────────────────────────────────────────────────────
    @Transactional
    public void deletePost(UUID postId, UUID userId) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new UnauthorizedException("You can only delete your own posts");
        }
        post.setDeletedAt(LocalDateTime.now());
        postRepository.save(post);
    }

    // ── Feed: following + own posts ───────────────────────────────────────
    // BUG FIX (from v4): own posts are now always included so a user who
    // follows nobody still sees their own posts immediately.


    // ── Discover: public posts ────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PostResponse> getDiscover(int page, int size) {
        List<Post> posts = postRepository.findDiscover(page * size, size);
        // Discover is unauthenticated — saved state is always false
        return buildPostResponseList(posts, null);
    }

    // ── User's own posts (profile page) ───────────────────────────────────
    @Transactional(readOnly = true)
    public List<PostResponse> getUserPosts(UUID authorId, int page, int size) {
        List<Post> posts = postRepository.findByAuthorIdAndDeletedAtIsNull(
                authorId, page * size, size);
        return buildPostResponseList(posts, null);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Build a list of PostResponse objects from a list of Post entities.
     * Batches all supporting queries (profiles, reactions, comment counts,
     * saved state) to avoid N+1 queries.
     *
     * @param requestingUserId the user requesting the feed — used to determine
     *                         saved state. Pass null for unauthenticated endpoints.
     */
    private List<PostResponse> buildPostResponseList(List<Post> posts, UUID requestingUserId) {
        if (posts.isEmpty()) return List.of();

        List<UUID> postIds   = posts.stream().map(Post::getId).toList();
        List<UUID> authorIds = posts.stream()
                .map(p -> p.getAuthor().getId()).distinct().toList();

        // ── Batch: author profiles ────────────────────────────────────────
        Map<UUID, Profile> profileMap = profileRepository.findByUserIdIn(authorIds).stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p));

        // ── Batch: reaction summaries ─────────────────────────────────────
        // Previously called per-post inside the stream — N queries → 1 query
        Map<UUID, List<ReactionSummaryResponse>> reactionsMap =
                buildReactionSummaryMap(postIds);

        // ── Batch: comment counts ─────────────────────────────────────────
        Map<UUID, Integer> commentCountMap = commentRepository
                .countByPostIdsAndDeletedAtIsNull(postIds).stream()
                .collect(Collectors.toMap(
                        row -> (UUID)   row[0],
                        row -> ((Number) row[1]).intValue()));

        // ── Batch: saved state ────────────────────────────────────────────
        Set<UUID> savedPostIds = (requestingUserId != null)
                ? savedPostRepository.findSavedPostIdsByUserId(requestingUserId, postIds)
                : Collections.emptySet();

        return posts.stream()
                .map(post -> {
                    UUID pid     = post.getId();
                    Profile prof = profileMap.get(post.getAuthor().getId());
                    return mapToResponse(
                            post,
                            post.getAuthor(),
                            prof,
                            reactionsMap.getOrDefault(pid, List.of()),
                            commentCountMap.getOrDefault(pid, 0),
                            savedPostIds.contains(pid));
                })
                .toList();
    }

    private PostResponse mapToResponse(Post post, User author, Profile profile,
                                       List<ReactionSummaryResponse> reactions,
                                       int commentCount, boolean saved) {
        return PostResponse.builder()
                .id(post.getId())
                .authorId(author.getId())
                .authorEmail(author.getEmail())
                .authorDisplayName(profile != null ? profile.getDisplayName() : null)
                // FIX: authorHeadline was never populated — now set from Profile
                .authorHeadline(profile != null ? profile.getHeadline() : null)
                .content(post.getContent())
                .visibility(post.getVisibility())
                .isEdited(post.getIsEdited())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .reactions(reactions)
                // FIX: these two fields were missing from mapToResponse
                .commentCount(commentCount)
                .saved(saved)
                .build();
    }

    /**
     * Build a per-post reaction summary map in one query.
     * Returns Map<postId, List<ReactionSummaryResponse>>.
     */
    private Map<UUID, List<ReactionSummaryResponse>> buildReactionSummaryMap(List<UUID> postIds) {
        return postReactionRepository.countByReactionTypeForPosts(postIds)
                .stream()
                .collect(Collectors.groupingBy(
                        row -> (UUID) row[0],
                        Collectors.mapping(
                                row -> new ReactionSummaryResponse(
                                        (String) row[1],   // name
                                        (String) row[2],   // emoji
                                        ((Number) row[3]).longValue()), // count
                                Collectors.toList())));
    }

    private List<ReactionSummaryResponse> buildReactionSummary(List<Object[]> rows) {
        return rows.stream()
                .map(row -> new ReactionSummaryResponse(
                        (String) row[0],
                        (String) row[1],
                        ((Number) row[2]).longValue()))
                .toList();
    }
        // ── Feed: following + own posts ───────────────────────────────────────
    // Pass userId as both a member of followingIds AND as viewerId so the
    // query can apply visibility rules: own posts = any visibility,
    // others' posts = public or connections only (never private).
    @Transactional(readOnly = true)
    public List<PostResponse> getFeed(UUID userId, int page, int size) {
        List<UUID> followingIds = followRepository.findFollowingByUserId(userId)
                .stream().map(User::getId).collect(Collectors.toCollection(ArrayList::new));
 
        if (!followingIds.contains(userId)) {
            followingIds.add(userId);
        }
 
        List<Post> posts = postRepository.findFeedByUserIds(
                followingIds, userId, page * size, size);   // ← added userId as viewerId
        return buildPostResponseList(posts, userId);
    }
    // Called by UserController for the saved posts list.
// Builds a full PostResponse for a single Post entity.
@Transactional(readOnly = true)
public PostResponse buildSinglePostResponse(Post post, UUID requestingUserId) {
    Profile profile = profileRepository.findByUserId(post.getAuthor().getId()).orElse(null);
    List<ReactionSummaryResponse> reactions = buildReactionSummary(
            postReactionRepository.countByReactionTypeForPost(post.getId()));
    int commentCount = commentRepository.countByPostIdAndDeletedAtIsNull(post.getId());
    boolean saved = savedPostRepository.existsByUserIdAndPostId(
            requestingUserId, post.getId());
    return mapToResponse(post, post.getAuthor(), profile, reactions, commentCount, saved);
}
}