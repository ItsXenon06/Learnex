package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.Hashtag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HashtagRepository extends JpaRepository<Hashtag, UUID> {
    Optional<Hashtag> findByTag(String tag);
    boolean existsByTag(String tag);
    
    // Get trending hashtags sorted by post count (most posts = trending)
    @Query("""
        SELECT h FROM Hashtag h
        LEFT JOIN PostHashtag ph ON ph.hashtag.id = h.id
        LEFT JOIN Post p ON p.id = ph.post.id
        WHERE p.deletedAt IS NULL
        GROUP BY h.id
        ORDER BY COUNT(ph.id) DESC
        """)
    List<Hashtag> findTrendingHashtags(Pageable pageable);
}
