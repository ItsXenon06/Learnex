package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    /**
     * Find all conversations that a user is a member of,
     * ordered by most recently created (last-message ordering is handled in service).
     */
    @Query("""
            SELECT c FROM Conversation c
            JOIN ConversationMember cm ON cm.conversation = c
            WHERE cm.user.id = :userId
            ORDER BY c.createdAt DESC
            """)
    List<Conversation> findAllByMemberId(@Param("userId") UUID userId);

    /**
     * Find an existing DM conversation between exactly two users.
     * Used to avoid creating duplicate DMs.
     */
    @Query("""
            SELECT c FROM Conversation c
            JOIN ConversationMember cm1 ON cm1.conversation = c AND cm1.user.id = :userA
            JOIN ConversationMember cm2 ON cm2.conversation = c AND cm2.user.id = :userB
            WHERE c.type = 'dm'
            """)
    Optional<Conversation> findExistingDm(@Param("userA") UUID userA,
                                          @Param("userB") UUID userB);
            @Query("""
        SELECT c FROM Conversation c
        WHERE c.type = 'group'
          AND c.name = :groupTag
        """)
Optional<Conversation> findGroupConversationByTag(@Param("groupTag") String groupTag);
}