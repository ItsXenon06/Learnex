package com.studentsocial.backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

// MD-5 FIX: no validation at all — oversized or blank strings could be written to the DB.
@Data
public class UpdateProfileRequest {

    @Size(max = 100, message = "Display name must be 100 characters or fewer")
    private String displayName;

    @Size(max = 160, message = "Headline must be 160 characters or fewer")
    private String headline;

    @Size(max = 2000, message = "Bio must be 2000 characters or fewer")
    private String bio;

    @Size(max = 500, message = "Website URL must be 500 characters or fewer")
    private String website;
}