package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.GroupMember;
import com.studentsocial.backend.model.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {

    boolean existsByGroupIdAndUserId(UUID groupId, UUID userId);

    void deleteByGroupIdAndUserId(UUID groupId, UUID userId);

    List<GroupMember> findByGroupId(UUID groupId);

    // All groups a user belongs to — used by GET /api/users/me/groups
    @Query("SELECT gm.group FROM GroupMember gm WHERE gm.user.id = :userId")
    List<StudyGroup> findGroupsByUserId(@Param("userId") UUID userId);
}