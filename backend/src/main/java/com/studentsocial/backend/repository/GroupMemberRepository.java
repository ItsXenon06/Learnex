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

    Optional<GroupMember> findByGroupIdAndUserId(UUID groupId, UUID userId);

    void deleteByGroupIdAndUserId(UUID groupId, UUID userId);

    List<GroupMember> findByGroupId(UUID groupId);

    @Query("SELECT gm.group FROM GroupMember gm WHERE gm.user.id = :userId")
    List<StudyGroup> findGroupsByUserId(@Param("userId") UUID userId);

    // Succession query: earliest admin in the group by joinedAt
    // Used when owner leaves to find the longest-standing admin to promote
    @Query("""
        SELECT gm FROM GroupMember gm
        WHERE gm.group.id = :groupId
          AND gm.user.id  <> :excludeUserId
          AND gm.role.name = 'admin'
        ORDER BY gm.joinedAt ASC
        """)
    Optional<GroupMember> findEarliestAdminByGroupId(
            @Param("groupId")       UUID   groupId,
            @Param("excludeUserId") UUID   excludeUserId);

    // Succession query: earliest non-admin/non-owner member in the group by joinedAt
    // Used when owner leaves and no admin exists to find the longest-standing member to promote
    @Query("""
        SELECT gm FROM GroupMember gm
        WHERE gm.group.id = :groupId
          AND gm.user.id  <> :excludeUserId
          AND gm.role.name = 'member'
        ORDER BY gm.joinedAt ASC
        """)
    Optional<GroupMember> findEarliestMemberByGroupId(
            @Param("groupId")       UUID   groupId,
            @Param("excludeUserId") UUID   excludeUserId);
}
