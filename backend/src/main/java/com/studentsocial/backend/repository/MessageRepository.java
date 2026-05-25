package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    /**
     * Paginated messages for a conversation, newest first.
     * Excludes hard-deleted messages (isDeleted = true hides content but row stays).
     */
    @Query("""
            SELECT m FROM Message m
            WHERE m.conversation.id = :convId
            ORDER BY m.sentAt DESC
            """)
    Page<Message> findByConversationId(@Param("convId") UUID convId, Pageable pageable);

    /**
     * Fetch the single most recent non-deleted message for a conversation.
     * Used for the last-message preview in the conversation list.
     */
    @Query("""
            SELECT m FROM Message m
            WHERE m.conversation.id = :convId
              AND m.isDeleted = false
            ORDER BY m.sentAt DESC
            LIMIT 1
            """)
    Optional<Message> findLastMessage(@Param("convId") UUID convId);

    /** Verify that a message belongs to a given conversation — used before marking read. */
    @Query("""
            SELECT m FROM Message m
            WHERE m.id = :messageId
              AND m.conversation.id = :convId
            """)
    Optional<Message> findByIdAndConversationId(
            @Param("messageId") UUID messageId,
            @Param("convId") UUID convId);
}