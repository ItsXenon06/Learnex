package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.Post;
import com.studentsocial.backend.model.SavedPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.beans.Transient;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface SavedPostRepository extends JpaRepository<SavedPost, UUID> {

    // Check if a user has saved a specific post (used by save endpoint — idempotency)
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);

    // Remove a saved post row (used by unsave endpoint)
    @Modifying
    @Transactional
    void deleteByUserIdAndPostId(UUID userId, UUID postId);

    // Batch lookup — called by PostService.buildPostResponseList to populate
    // post.saved for an entire feed page in one query instead of N queries.
    // Returns the subset of the given postIds that this user has saved.
    @Query("""
        SELECT sp.post.id
        FROM SavedPost sp
        WHERE sp.user.id  = :userId
          AND sp.post.id IN :postIds
        """)
    Set<UUID> findSavedPostIdsByUserId(
            @Param("userId")  UUID       userId,
            @Param("postIds") List<UUID> postIds);

    // All saved posts for a user, newest save first — used by SavedPage
    @Query("""
        SELECT sp.post
        FROM SavedPost sp
        WHERE sp.user.id    = :userId
          AND sp.post.deletedAt IS NULL
        ORDER BY sp.savedAt DESC
        """)
    List<Post> findPostsByUserId(@Param("userId") UUID userId);
}