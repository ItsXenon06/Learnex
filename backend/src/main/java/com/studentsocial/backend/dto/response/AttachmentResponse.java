package com.studentsocial.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class AttachmentResponse {
    private UUID   id;
    private String url;
    private String mimeType;
    private String type;       // image | video | pdf | document
    private Integer width;
    private Integer height;
    private Short   sortOrder;
}