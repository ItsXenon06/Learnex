package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.CommentReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommentReactionRepository extends JpaRepository<CommentReaction, UUID> {

    Optional<CommentReaction> findByCommentIdAndUserId(UUID commentId, UUID userId);

    @Query("""
        SELECT cr.reactionType.name, cr.reactionType.emoji, COUNT(cr)
        FROM CommentReaction cr
        WHERE cr.comment.id = :commentId
        GROUP BY cr.reactionType.name, cr.reactionType.emoji
        ORDER BY COUNT(cr) DESC
    """)
    List<Object[]> countByReactionTypeForComment(@Param("commentId") UUID commentId);

    void deleteByCommentIdAndUserId(UUID commentId, UUID userId);
}