package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MessagePageResponse {

    private List<MessageResponse> messages;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;
}