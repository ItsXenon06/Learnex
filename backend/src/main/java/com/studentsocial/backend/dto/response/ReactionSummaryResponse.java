package com.studentsocial.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

// FIX: field was 'reactionType' — frontend reads r.name (matching reaction_type.name
// in the DB and the seed data values: like, love, insightful, support, celebrate).
// Renamed to 'name' so FeedPage's RX_EMOJI[r.name] lookup works correctly.
@Data
@AllArgsConstructor
public class ReactionSummaryResponse {
    private String name;    // was 'reactionType' — renamed to match frontend + DB
    private String emoji;
    private long   count;
}