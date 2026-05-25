package com.studentsocial.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdatePreferenceRequest {
    private Boolean email;
    private Boolean push;
    private Boolean inApp;
}