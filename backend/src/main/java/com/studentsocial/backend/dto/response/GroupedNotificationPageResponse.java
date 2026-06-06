package com.studentsocial.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Paginated response for grouped notifications.
 * Contains either individual or grouped notifications depending on the request param.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GroupedNotificationPageResponse {
    
    private List<GroupedNotificationResponse> content;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private int unreadCount;
}
