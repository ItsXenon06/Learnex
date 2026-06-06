package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.Post;
import com.studentsocial.backend.model.PostHashtag;
import com.studentsocial.backend.model.PostHashtag.PostHashtagId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostHashtagRepository extends JpaRepository<PostHashtag, PostHashtagId> {
    List<PostHashtag> findByPostId(UUID postId);
    void deleteByPostId(UUID postId);
    
    // Get all posts with a specific hashtag (not deleted), paginated
    @Query("""
        SELECT ph.post FROM PostHashtag ph
        WHERE ph.hashtag.tag = :tag
          AND ph.post.deletedAt IS NULL
        ORDER BY ph.post.createdAt DESC
        """)
    Page<Post> findPostsByHashtag(
            @Param("tag") String tag,
            Pageable pageable
    );
}
