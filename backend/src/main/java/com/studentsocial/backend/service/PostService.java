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
import com.studentsocial.backend.repository.StudyGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.studentsocial.backend.repository.PostAttachmentRepository;
import com.studentsocial.backend.model.PostAttachment;
import com.studentsocial.backend.dto.response.AttachmentResponse;
import com.studentsocial.backend.model.MediaFile;
import com.studentsocial.backend.repository.MediaFileRepository;
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

    private final PostRepository           postRepository;
    private final PostAttachmentRepository postAttachmentRepository;
    private final UserRepository           userRepository;
    private final MediaFileRepository      mediaFileRepository;   // FIX: was commented out
    private final FollowRepository         followRepository;
    private final ProfileRepository        profileRepository;
    private final PostReactionRepository   postReactionRepository;
    private final CommentRepository        commentRepository;
    private final SavedPostRepository      savedPostRepository;
    private final StudyGroupRepository      studyGroupRepository; // FIX: needed for group posts
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
        // ADD after postRepository.save(...):
if (request.getGroupId() != null) {
    studyGroupRepository.findById(request.getGroupId()).ifPresent(post::setGroup);
    postRepository.save(post); // re-save with group
}

        if (request.getMediaIds() != null && !request.getMediaIds().isEmpty()) {
            short order = 0;
            for (UUID mediaId : request.getMediaIds()) {
                MediaFile media = mediaFileRepository.findById(mediaId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException("Media not found: " + mediaId));

                String type =
                        media.getMimeType().startsWith("video/")        ? "video"
                      : media.getMimeType().startsWith("image/")        ? "image"
                      : media.getMimeType().equals("application/pdf")   ? "pdf"
                      : "document";

                postAttachmentRepository.save(
                        PostAttachment.builder()
                                .post(post)
                                .media(media)
                                .type(type)
                                .sortOrder(order++)
                                .build()
                );
            }
        }

        Profile profile = profileRepository.findByUserId(authorId).orElse(null);
        List<PostAttachment> attachments =
                postAttachmentRepository.findByPostIdOrderBySortOrderAsc(post.getId());

        return mapToResponse(post, author, profile, List.of(), 0, false, attachments);
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
        // FIX: was calling the non-existent 6-arg overload; fetch attachments and use 7-arg
        List<PostAttachment> attachments =
                postAttachmentRepository.findByPostIdOrderBySortOrderAsc(postId);
        return mapToResponse(post, post.getAuthor(), profile, reactions, commentCount, false, attachments);
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

    // ── Discover: public posts ────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PostResponse> getDiscover(int page, int size) {
        List<Post> posts = postRepository.findDiscover(page * size, size);
        return buildPostResponseList(posts, null);
    }

    // ── User's own posts (profile page) ───────────────────────────────────
    @Transactional(readOnly = true)
    public List<PostResponse> getUserPosts(UUID authorId, int page, int size) {
        List<Post> posts = postRepository.findByAuthorIdAndDeletedAtIsNull(
                authorId, page * size, size);
        return buildPostResponseList(posts, null);
    }

    // ── Feed: following + own posts ───────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PostResponse> getFeed(UUID userId, int page, int size) {
        List<UUID> followingIds = followRepository.findFollowingByUserId(userId)
                .stream().map(User::getId).collect(Collectors.toCollection(ArrayList::new));

        if (!followingIds.contains(userId)) {
            followingIds.add(userId);
        }

        List<Post> posts = postRepository.findFeedByUserIds(
                followingIds, userId, page * size, size);
        return buildPostResponseList(posts, userId);
    }

    // ── Saved posts helper (called by UserController) ─────────────────────
    @Transactional(readOnly = true)
    public PostResponse buildSinglePostResponse(Post post, UUID requestingUserId) {
        Profile profile = profileRepository.findByUserId(post.getAuthor().getId()).orElse(null);
        List<ReactionSummaryResponse> reactions = buildReactionSummary(
                postReactionRepository.countByReactionTypeForPost(post.getId()));
        int commentCount = commentRepository.countByPostIdAndDeletedAtIsNull(post.getId());
        boolean saved = savedPostRepository.existsByUserIdAndPostId(requestingUserId, post.getId());
        List<PostAttachment> attachments =
                postAttachmentRepository.findByPostIdOrderBySortOrderAsc(post.getId());
        return mapToResponse(post, post.getAuthor(), profile, reactions, commentCount, saved, attachments);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────

    private List<PostResponse> buildPostResponseList(List<Post> posts, UUID requestingUserId) {
        if (posts.isEmpty()) return List.of();

        List<UUID> postIds   = posts.stream().map(Post::getId).toList();
        List<UUID> authorIds = posts.stream()
                .map(p -> p.getAuthor().getId()).distinct().toList();

        Map<UUID, Profile> profileMap = profileRepository.findByUserIdIn(authorIds).stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p));

        Map<UUID, List<ReactionSummaryResponse>> reactionsMap =
                buildReactionSummaryMap(postIds);

        Map<UUID, Integer> commentCountMap = commentRepository
                .countByPostIdsAndDeletedAtIsNull(postIds).stream()
                .collect(Collectors.toMap(
                        row -> (UUID)    row[0],
                        row -> ((Number) row[1]).intValue()));

        Set<UUID> savedPostIds = (requestingUserId != null)
                ? savedPostRepository.findSavedPostIdsByUserId(requestingUserId, postIds)
                : Collections.emptySet();

        Map<UUID, List<PostAttachment>> attachmentsMap =
                postAttachmentRepository.findByPostIdsOrderBySortOrder(postIds)
                        .stream()
                        .collect(Collectors.groupingBy(a -> a.getPost().getId()));

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
                            savedPostIds.contains(pid),
                            attachmentsMap.getOrDefault(pid, List.of()));
                })
                .toList();
    }

    private PostResponse mapToResponse(Post post, User author, Profile profile,
                                       List<ReactionSummaryResponse> reactions,
                                       int commentCount, boolean saved,
                                       List<PostAttachment> attachments) {
        return PostResponse.builder()
                .id(post.getId())
                .authorId(author.getId())
                .authorEmail(author.getEmail())
                .authorDisplayName(profile != null ? profile.getDisplayName() : null)
                .authorHeadline(profile != null ? profile.getHeadline() : null)
                .content(post.getContent())
                .visibility(post.getVisibility())
                .isEdited(post.getIsEdited())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .reactions(reactions)
                .commentCount(commentCount)
                .saved(saved)
                .attachments(
                        attachments.stream()
                                .map(a -> AttachmentResponse.builder()
                                        .id(a.getId())
                                        .url(a.getMedia().getUrl())
                                        .mimeType(a.getMedia().getMimeType())
                                        .type(a.getType())
                                        .width(a.getMedia().getWidth())
                                        .height(a.getMedia().getHeight())
                                        .sortOrder(a.getSortOrder())
                                        .build())
                                .toList()
                )
                .build();
    }

    private Map<UUID, List<ReactionSummaryResponse>> buildReactionSummaryMap(List<UUID> postIds) {
        return postReactionRepository.countByReactionTypeForPosts(postIds)
                .stream()
                .collect(Collectors.groupingBy(
                        row -> (UUID) row[0],
                        Collectors.mapping(
                                row -> new ReactionSummaryResponse(
                                        (String) row[1],
                                        (String) row[2],
                                        ((Number) row[3]).longValue()),
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
    @Transactional(readOnly = true)
public List<PostResponse> buildGroupPostResponses(List<Post> posts, UUID requestingUserId) {
    return buildPostResponseList(posts, requestingUserId);
}
 
// ── Discover sorted by likes ──────────────────────────────────────────────
@Transactional(readOnly = true)
public List<PostResponse> getDiscoverSortedByLikes(String window, int page, int size) {
    List<Post> posts = postRepository.findDiscoverSortedByLikes(window, page * size, size);
    return buildPostResponseList(posts, null);
}
 
// ── Feed sorted by likes ──────────────────────────────────────────────────
@Transactional(readOnly = true)
public List<PostResponse> getFeedSortedByLikes(UUID userId, String window, int page, int size) {
    List<UUID> followingIds = followRepository.findFollowingByUserId(userId)
            .stream().map(User::getId).collect(Collectors.toCollection(ArrayList::new));
    if (!followingIds.contains(userId)) followingIds.add(userId);
 
    List<Post> posts = postRepository.findFeedByUserIdsSortedByLikes(
            followingIds, userId, window, page * size, size);
    return buildPostResponseList(posts, userId);
}
}