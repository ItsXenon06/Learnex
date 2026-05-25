package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class NotificationPageResponse {

    private List<NotificationResponse> notifications;
    private long unreadCount;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;
}