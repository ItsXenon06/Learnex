package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {

    Optional<Comment> findByIdAndDeletedAtIsNull(UUID id);

    // Top-level comments for a post (parent IS NULL), oldest first
    @Query("""
        SELECT c FROM Comment c
        JOIN FETCH c.author
        WHERE c.post.id = :postId
          AND c.parent IS NULL
          AND c.deletedAt IS NULL
        ORDER BY c.createdAt ASC
    """)
    List<Comment> findTopLevelByPostId(@Param("postId") UUID postId);

    // Direct replies to a specific comment, oldest first
    @Query("""
        SELECT c FROM Comment c
        JOIN FETCH c.author
        WHERE c.parent.id = :parentId
          AND c.deletedAt IS NULL
        ORDER BY c.createdAt ASC
    """)
    List<Comment> findRepliesByParentId(@Param("parentId") UUID parentId);
    // Single post comment count (used by getPost)
int countByPostIdAndDeletedAtIsNull(UUID postId);

// Batch comment count for feed (replaces N individual calls)
// Returns List<Object[]> where row[0]=postId (UUID), row[1]=count (Long)
@Query("""
    SELECT c.post.id, COUNT(c)
    FROM Comment c
    WHERE c.post.id IN :postIds
      AND c.deletedAt IS NULL
    GROUP BY c.post.id
    """)
List<Object[]> countByPostIdsAndDeletedAtIsNull(@Param("postIds") List<UUID> postIds);
}