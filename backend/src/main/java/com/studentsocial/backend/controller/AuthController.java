package com.studentsocial.backend.controller;

import com.studentsocial.backend.dto.request.LoginRequest;
import com.studentsocial.backend.dto.request.RegisterRequest;
import com.studentsocial.backend.dto.response.ApiResponse;
import com.studentsocial.backend.dto.response.AuthResponse;
import com.studentsocial.backend.dto.request.ForgotPasswordRequest;
import com.studentsocial.backend.dto.request.OAuthRequest;
import com.studentsocial.backend.dto.request.ResetPasswordRequest;
import com.studentsocial.backend.service.AuthService;
import java.util.Map;
import java.util.HashMap;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }

    @PostMapping("/oauth")
    public ResponseEntity<ApiResponse<AuthResponse>> oauthLogin(
            @Valid @RequestBody OAuthRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.oauthLogin(request)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        String token = authService.forgotPassword(request.getEmail());
        Map<String, String> resp = new HashMap<>();
        if (token != null) resp.put("token", token);
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Object>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successful"));
    }
}