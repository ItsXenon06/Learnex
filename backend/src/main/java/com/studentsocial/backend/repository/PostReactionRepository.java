package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.PostReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostReactionRepository extends JpaRepository<PostReaction, UUID> {

    Optional<PostReaction> findByPostIdAndUserId(UUID postId, UUID userId);
// Batch reaction summary for a list of posts (replaces N individual calls).
// Returns List<Object[]> where row[0]=postId, row[1]=name, row[2]=emoji, row[3]=count
@Query("""
    SELECT pr.post.id, rt.name, rt.emoji, COUNT(pr)
    FROM PostReaction pr
    JOIN pr.reactionType rt
    WHERE pr.post.id IN :postIds
    GROUP BY pr.post.id, rt.name, rt.emoji
    """)
List<Object[]> countByReactionTypeForPosts(@Param("postIds") List<UUID> postIds);
    // Returns each reaction type name + emoji + count for a post
    @Query("""
        SELECT pr.reactionType.name, pr.reactionType.emoji, COUNT(pr)
        FROM PostReaction pr
        WHERE pr.post.id = :postId
        GROUP BY pr.reactionType.name, pr.reactionType.emoji
        ORDER BY COUNT(pr) DESC
    """)
    List<Object[]> countByReactionTypeForPost(@Param("postId") UUID postId);

    void deleteByPostIdAndUserId(UUID postId, UUID userId);

    boolean existsByPostIdAndUserId(UUID postId, UUID userId);
}