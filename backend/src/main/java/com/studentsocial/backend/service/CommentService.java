package com.studentsocial.backend.service;

import com.studentsocial.backend.dto.request.CreateCommentRequest;
import com.studentsocial.backend.dto.request.ReactRequest;
import com.studentsocial.backend.dto.response.CommentResponse;
import com.studentsocial.backend.dto.response.ReactionSummaryResponse;
import com.studentsocial.backend.exception.ResourceNotFoundException;
import com.studentsocial.backend.exception.UnauthorizedException;
import com.studentsocial.backend.model.*;
import com.studentsocial.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentReactionRepository commentReactionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final ReactionTypeRepository reactionTypeRepository;
    private final NotificationService notificationService;

    // ---------------------------------------------------------------
    // Comments
    // ---------------------------------------------------------------

    /**
     * Create a top-level comment or a reply (parentId present = reply).
     * Fires a 'comment' notification to:
     *   - the post author (if commenter != author)
     *   - the parent comment author (if this is a reply and different from post author)
     */
    @Transactional
    public CommentResponse createComment(UUID postId, CreateCommentRequest request) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        User author = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Comment.CommentBuilder builder = Comment.builder()
                .post(post)
                .author(author)
                .content(request.getContent());

        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findByIdAndDeletedAtIsNull(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
            if (!parent.getPost().getId().equals(postId)) {
                throw new IllegalArgumentException("Parent comment does not belong to this post");
            }
            builder.parent(parent);
        }

        Comment saved = commentRepository.save(builder.build());

        // Resolve actor display name once
        String actorName = profileRepository.findByUserId(request.getUserId())
                .map(p -> p.getDisplayName() != null ? p.getDisplayName() : author.getEmail())
                .orElse(author.getEmail());

        UUID actorId  = request.getUserId();
        UUID postAuthorId = post.getAuthor().getId();

        // Notify post author (skip if self-comment)
        if (!postAuthorId.equals(actorId)) {
            notificationService.sendComment(postAuthorId, actorId, actorName, postId, saved.getId());
        }

        // Notify parent comment author if reply (skip if same as post author — already notified)
        if (parent != null) {
            UUID parentAuthorId = parent.getAuthor().getId();
            if (!parentAuthorId.equals(actorId) && !parentAuthorId.equals(postAuthorId)) {
                notificationService.sendComment(parentAuthorId, actorId, actorName, postId, saved.getId());
            }
        }

        return toResponse(saved, List.of(), List.of());
    }

    /**
     * Get all top-level comments for a post with nested replies loaded recursively.
     */
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(UUID postId) {
        postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        return commentRepository.findTopLevelByPostId(postId)
                .stream()
                .map(comment -> toResponse(
                        comment,
                        buildReactionSummary(commentReactionRepository.countByReactionTypeForComment(comment.getId())),
                        buildReplies(comment.getId())))
                .toList();
    }

    /**
     * Soft-delete a comment. Only the author may delete their own comment.
     */
    @Transactional
    public void deleteComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getAuthor().getId().equals(userId)) {
            throw new UnauthorizedException("You can only delete your own comments");
        }

        comment.setDeletedAt(LocalDateTime.now());
        commentRepository.save(comment);
    }

    // ---------------------------------------------------------------
    // Comment Reactions
    // ---------------------------------------------------------------

    @Transactional
    public List<ReactionSummaryResponse> reactToComment(UUID commentId, ReactRequest request) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ReactionType reactionType = reactionTypeRepository.findByName(request.getReactionType())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reaction type not found: " + request.getReactionType()));

        Optional<CommentReaction> existing =
                commentReactionRepository.findByCommentIdAndUserId(commentId, request.getUserId());

        if (existing.isPresent()) {
            existing.get().setReactionType(reactionType);
            commentReactionRepository.save(existing.get());
        } else {
            CommentReaction reaction = CommentReaction.builder()
                    .comment(comment)
                    .user(user)
                    .reactionType(reactionType)
                    .build();
            commentReactionRepository.save(reaction);
        }

        return buildReactionSummary(
                commentReactionRepository.countByReactionTypeForComment(commentId));
    }

    @Transactional
    public List<ReactionSummaryResponse> removeCommentReaction(UUID commentId, UUID userId) {
        commentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        commentReactionRepository.deleteByCommentIdAndUserId(commentId, userId);
        return buildReactionSummary(
                commentReactionRepository.countByReactionTypeForComment(commentId));
    }

    // ---------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------

    private List<CommentResponse> buildReplies(UUID parentId) {
        return commentRepository.findRepliesByParentId(parentId)
                .stream()
                .map(reply -> toResponse(
                        reply,
                        buildReactionSummary(commentReactionRepository.countByReactionTypeForComment(reply.getId())),
                        buildReplies(reply.getId())))
                .toList();
    }

    private List<ReactionSummaryResponse> buildReactionSummary(List<Object[]> rows) {
        return rows.stream()
                .map(row -> new ReactionSummaryResponse(
                        (String) row[0],
                        (String) row[1],
                        ((Number) row[2]).longValue()))
                .toList();
    }

    private CommentResponse toResponse(Comment comment,
                                       List<ReactionSummaryResponse> reactions,
                                       List<CommentResponse> replies) {
        String displayName = profileRepository.findByUserId(comment.getAuthor().getId())
                .map(Profile::getDisplayName)
                .orElse(null);

        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .authorId(comment.getAuthor().getId())
                .authorEmail(comment.getAuthor().getEmail())
                .authorDisplayName(displayName)
                .content(comment.getContent())
                .isEdited(comment.isEdited())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .reactions(reactions)
                .replies(replies)
                .build();
    }
}