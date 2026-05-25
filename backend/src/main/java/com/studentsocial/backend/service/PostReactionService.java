package com.studentsocial.backend.service;

import com.studentsocial.backend.dto.request.ReactRequest;
import com.studentsocial.backend.dto.response.ReactionSummaryResponse;
import com.studentsocial.backend.exception.ResourceNotFoundException;
import com.studentsocial.backend.model.Post;
import com.studentsocial.backend.model.PostReaction;
import com.studentsocial.backend.model.ReactionType;
import com.studentsocial.backend.model.User;
import com.studentsocial.backend.repository.PostReactionRepository;
import com.studentsocial.backend.repository.PostRepository;
import com.studentsocial.backend.repository.ProfileRepository;
import com.studentsocial.backend.repository.ReactionTypeRepository;
import com.studentsocial.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostReactionService {

    private final PostReactionRepository postReactionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ReactionTypeRepository reactionTypeRepository;
    private final ProfileRepository profileRepository;
    private final NotificationService notificationService;

    /**
     * Add or replace the calling user's reaction on a post (upsert).
     * Fires a 'like' notification to the post author (skipped if self-reaction).
     */
    @Transactional
    public List<ReactionSummaryResponse> react(UUID postId, ReactRequest request) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ReactionType reactionType = reactionTypeRepository.findByName(request.getReactionType())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reaction type not found: " + request.getReactionType()));

        Optional<PostReaction> existing =
                postReactionRepository.findByPostIdAndUserId(postId, request.getUserId());

        boolean isNew = existing.isEmpty();

        if (existing.isPresent()) {
            existing.get().setReactionType(reactionType);
            postReactionRepository.save(existing.get());
        } else {
            PostReaction reaction = PostReaction.builder()
                    .post(post)
                    .user(user)
                    .reactionType(reactionType)
                    .build();
            postReactionRepository.save(reaction);
        }

        // Notify post author — only on new reactions, never self-notify
        UUID authorId = post.getAuthor().getId();
        if (isNew && !authorId.equals(request.getUserId())) {
            String actorName = profileRepository.findByUserId(request.getUserId())
                    .map(p -> p.getDisplayName() != null ? p.getDisplayName() : user.getEmail())
                    .orElse(user.getEmail());
            notificationService.sendLike(authorId, request.getUserId(), actorName,
                    postId, request.getReactionType());
        }

        return getReactionSummary(postId);
    }

    /**
     * Remove the calling user's reaction from a post.
     */
    @Transactional
    public List<ReactionSummaryResponse> removeReaction(UUID postId, UUID userId) {
        postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        postReactionRepository.deleteByPostIdAndUserId(postId, userId);
        return getReactionSummary(postId);
    }

    /**
     * Get aggregated reaction counts for a post, grouped by reaction type.
     */
    @Transactional(readOnly = true)
    public List<ReactionSummaryResponse> getReactionSummary(UUID postId) {
        return postReactionRepository.countByReactionTypeForPost(postId)
                .stream()
                .map(row -> new ReactionSummaryResponse(
                        (String) row[0],
                        (String) row[1],
                        ((Number) row[2]).longValue()))
                .toList();
    }
}