package com.studentsocial.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "post_hashtag")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(PostHashtag.PostHashtagId.class) // Using IdClass for composite primary key
public class PostHashtag {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hashtag_id", nullable = false)
    private Hashtag hashtag;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostHashtagId implements Serializable {
        private UUID post;
        private UUID hashtag;
    }
}
