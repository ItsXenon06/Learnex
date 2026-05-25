package com.studentsocial.backend.service;

import com.studentsocial.backend.exception.ResourceNotFoundException;
import com.studentsocial.backend.model.Post;
import com.studentsocial.backend.model.SavedPost;
import com.studentsocial.backend.model.User;
import com.studentsocial.backend.repository.PostRepository;
import com.studentsocial.backend.repository.SavedPostRepository;
import com.studentsocial.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SavedPostService {

    private final SavedPostRepository savedPostRepository;
    private final PostRepository      postRepository;
    private final UserRepository      userRepository;

    /**
     * Save a post for a user. Idempotent — calling it twice has no effect.
     */
    @Transactional
    public void savePost(UUID userId, UUID postId) {
        if (savedPostRepository.existsByUserIdAndPostId(userId, postId)) {
            return; // already saved
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        savedPostRepository.save(SavedPost.builder()
                .user(user)
                .post(post)
                .build());
    }

    /**
     * Remove a saved post. Idempotent — silently succeeds if row doesn't exist.
     */
    @Transactional
    public void unsavePost(UUID userId, UUID postId) {
        savedPostRepository.deleteByUserIdAndPostId(userId, postId);
    }
}