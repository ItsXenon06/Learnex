package com.studentsocial.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Grouped notification response.
 * 
 * When grouped:
 * - Multiple notifications of the same type targeting the same resource are combined
 * - count: how many individual notifications were combined
 * - actorNames: list of unique actor names (limited to first 3, with "+N more" if applicable)
 * - latestCreatedAt: timestamp of the most recent notification in the group
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GroupedNotificationResponse {

    private UUID id;
    private String type;  // like | comment | mention | follow | message
    private boolean isRead;
    
    // Grouping info
    private int count;  // how many notifications grouped
    private List<String> actorNames;  // up to 3 names, then "+N more"
    private String summary;  // Human-readable summary, e.g. "Alice and 2 others liked your post"
    
    // Payload (usually contains the first/primary notification's payload)
    private Map<String, Object> payloadJson;
    
    // Timestamps
    private LocalDateTime latestCreatedAt;
    private LocalDateTime firstCreatedAt;
    
    // For UI: link to related resource
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private UUID relatedPostId;  // if applicable
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private UUID relatedConversationId;  // if applicable (messages)
}
