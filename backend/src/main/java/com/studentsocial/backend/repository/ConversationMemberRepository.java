package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.ConversationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationMemberRepository extends JpaRepository<ConversationMember, UUID> {

    @Query("SELECT cm FROM ConversationMember cm WHERE cm.conversation.id = :convId")
    List<ConversationMember> findByConversationId(@Param("convId") UUID convId);

    @Query("""
            SELECT cm FROM ConversationMember cm
            WHERE cm.conversation.id = :convId AND cm.user.id = :userId
            """)
    Optional<ConversationMember> findByConversationIdAndUserId(
            @Param("convId") UUID convId,
            @Param("userId") UUID userId);

    @Query("""
            SELECT COUNT(m) FROM Message m
            JOIN ConversationMember cm
              ON cm.conversation.id = m.conversation.id
             AND cm.user.id = :userId
            WHERE m.conversation.id = :convId
              AND m.sender.id <> :userId
              AND m.isDeleted = false
              AND (cm.lastReadAt IS NULL OR m.sentAt > cm.lastReadAt)
            """)
    long countUnread(@Param("convId") UUID convId, @Param("userId") UUID userId);
}