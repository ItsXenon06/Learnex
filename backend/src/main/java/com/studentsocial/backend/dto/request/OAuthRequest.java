package com.studentsocial.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OAuthRequest {
    @NotBlank(message = "Provider is required")
    @Pattern(regexp = "^(google|facebook)$", message = "Provider must be 'google' or 'facebook'")
    private String provider;

    @NotBlank(message = "Token is required")
    private String token; // id_token or access token from provider
}
