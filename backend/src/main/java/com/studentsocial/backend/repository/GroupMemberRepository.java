package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.GroupMember;
import com.studentsocial.backend.model.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {

    boolean existsByGroupIdAndUserId(UUID groupId, UUID userId);

    void deleteByGroupIdAndUserId(UUID groupId, UUID userId);

    List<GroupMember> findByGroupId(UUID groupId);

    @Query("SELECT gm.group FROM GroupMember gm WHERE gm.user.id = :userId")
    List<StudyGroup> findGroupsByUserId(@Param("userId") UUID userId);

    // Succession query: earliest admin in the group by joinedAt (excluding the owner).
    // Used when owner leaves to auto-promote the longest-standing admin.
    // Falls back to earliest plain member if no admins exist.
    @Query("""
        SELECT gm FROM GroupMember gm
        WHERE gm.group.id = :groupId
          AND gm.user.id  <> :excludeUserId
          AND gm.role.name = :roleName
        ORDER BY gm.joinedAt ASC
        LIMIT 1
        """)
    Optional<GroupMember> findEarliestByGroupIdAndRole(
            @Param("groupId")       UUID   groupId,
            @Param("excludeUserId") UUID   excludeUserId,
            @Param("roleName")      String roleName);
}