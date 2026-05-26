package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.PostAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PostAttachmentRepository extends JpaRepository<PostAttachment, UUID> {

    List<PostAttachment> findByPostIdOrderBySortOrderAsc(UUID postId);

    @Query("SELECT a FROM PostAttachment a WHERE a.post.id IN :postIds ORDER BY a.post.id, a.sortOrder")
    List<PostAttachment> findByPostIdsOrderBySortOrder(@Param("postIds") List<UUID> postIds);
}