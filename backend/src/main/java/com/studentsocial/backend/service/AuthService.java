package com.studentsocial.backend.service;

import com.studentsocial.backend.dto.request.LoginRequest;
import com.studentsocial.backend.dto.request.RegisterRequest;
import com.studentsocial.backend.dto.response.AuthResponse;
import com.studentsocial.backend.exception.UnauthorizedException;
import com.studentsocial.backend.model.Role;
import com.studentsocial.backend.model.User;
import com.studentsocial.backend.model.UserRole;
import com.studentsocial.backend.repository.ProfileRepository;
import com.studentsocial.backend.repository.RoleRepository;
import com.studentsocial.backend.repository.UserRepository;
import com.studentsocial.backend.repository.UserRoleRepository;
import com.studentsocial.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.studentsocial.backend.model.Profile;

import java.util.*;
import java.time.LocalDateTime;

import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
        private final com.studentsocial.backend.repository.OauthRepository oauthRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final com.studentsocial.backend.service.EmailService emailService;

    @Value("${frontend.origin:http://localhost:5173}")
    private String frontendOrigin;

    // Default role name must match the seeded roles in script.sql.
    // Seeded roles: student, teacher, staff, alumni, moderator, school_admin, platform_admin
    // "USER" was never seeded — HI-3 FIX: use "student" as the default registration role.
    private static final String DEFAULT_ROLE = "student";

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .isVerified(false)
                .isActive(true)
                .build();

        user = Objects.requireNonNull(userRepository.save(user));

        // HI-3 FIX: look up the seeded "student" role instead of creating "USER" on every
        // registration, which caused a race condition and a role that never existed in the DB.
        Role defaultRole = roleRepository.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> new RuntimeException(
                        "Default role '" + DEFAULT_ROLE + "' not found — run script.sql seed first"));

        UserRole userRoleMapping = UserRole.builder()
                .user(user)
                .role(defaultRole)
                .scopeType("global")
                .build();

        userRoleRepository.save(userRoleMapping);

// Build displayName from firstName + lastName if provided
String displayName = buildDisplayName(
        request.getFirstName(),
        request.getLastName(),
        request.getEmail()
);

// Create profile immediately after registration
Profile profile = Profile.builder()
        .user(user)
        .displayName(displayName)
        .build();

profileRepository.save(profile);

String token = jwtService.generateToken(
        user.getEmail(),
        List.of(DEFAULT_ROLE)
);

return AuthResponse.builder()
        .token(token)
        .userId(user.getId())
        .email(user.getEmail())
        .displayName(displayName)
        .roles(List.of(DEFAULT_ROLE))
        .build();
        }
        
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // BUG-2 FIX: AuthenticationException was uncaught → Spring returned 500.
        // Catch it and rethrow as UnauthorizedException so GlobalExceptionHandler returns 401.
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getIdentifier(), request.getPassword())
            );
        } catch (AuthenticationException ex) {
            throw new UnauthorizedException("Invalid email or password");
        }

        // BUG-2 FIX: after authenticate() succeeds the user definitely exists —
        // the previous orElseThrow was unreachable and misleading. Keep it for safety
        // but the real guard is the authenticate() call above.
        User user = userRepository.findByEmail(request.getIdentifier())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        
        var userRoles = userRoleRepository.findByUserId(user.getId());
        List<String> roles = userRoles.stream()
                .map(ur -> ur.getRole().getName())
                .toList();

        String token = jwtService.generateToken(user.getEmail(), roles);

String displayName = profileRepository.findByUserId(user.getId())
        .map(p -> p.getDisplayName() != null
                ? p.getDisplayName()
                : user.getEmail().split("@")[0])
        .orElse(user.getEmail().split("@")[0]);

return AuthResponse.builder()
        .token(token)
        .userId(user.getId())
        .email(user.getEmail())
        .displayName(displayName)
        .roles(roles)
        .build();
    }
    private String buildDisplayName(
        String firstName,
        String lastName,
        String email
) {

    String first = firstName != null
            ? firstName.trim()
            : "";

    String last = lastName != null
            ? lastName.trim()
            : "";

    if (!first.isEmpty() && !last.isEmpty()) {
        return first + " " + last;
    }

    if (!first.isEmpty()) {
        return first;
    }

    if (!last.isEmpty()) {
        return last;
    }

        // fallback to email prefix
        return email.split("@")[0];
}

        @Transactional
        public AuthResponse oauthLogin(com.studentsocial.backend.dto.request.OAuthRequest request) {
                String provider = request.getProvider();
                String token = request.getToken();

                String email = null;
                String oauthId = null;

                RestTemplate rest = new RestTemplate();
                try {
                        if ("google".equalsIgnoreCase(provider)) {
                                String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + token;
                                Map<String, Object> resp = rest.getForObject(url, Map.class);
                                if (resp != null) {
                                        email = (String) resp.get("email");
                                        oauthId = (String) resp.get("sub");
                                }
                        } else if ("facebook".equalsIgnoreCase(provider)) {
                                String url = "https://graph.facebook.com/me?fields=id,email&access_token=" + token;
                                Map<String, Object> resp = rest.getForObject(url, Map.class);
                                if (resp != null) {
                                        email = (String) resp.get("email");
                                        oauthId = (String) resp.get("id");
                                }
                        }
                } catch (RestClientException ex) {
                        throw new UnauthorizedException("Invalid OAuth token");
                }

                if (email == null) {
                        throw new UnauthorizedException("OAuth provider did not return an email");
                }

                email = email.toLowerCase();

                // First, try to find an existing OAuth mapping by provider+id
                User user = null;
                if (oauthId != null) {
                    var maybeOauth = oauthRepository.findByProviderAndProviderId(provider, oauthId);
                    if (maybeOauth.isPresent()) {
                        user = maybeOauth.get().getUser();
                    }
                }

                if (user == null) {
                    // next, try to find by email
                    user = userRepository.findByEmail(email).orElse(null);
                }

                if (user == null) {
                    // create new user
                    user = User.builder()
                            .email(email)
                            .isVerified(true)
                            .isActive(true)
                            .build();

                    user = userRepository.save(user);

                    Role defaultRole = roleRepository.findByName(DEFAULT_ROLE)
                            .orElseThrow(() -> new RuntimeException("Default role '" + DEFAULT_ROLE + "' not found"));

                    UserRole userRoleMapping = UserRole.builder()
                            .user(user)
                            .role(defaultRole)
                            .scopeType("global")
                            .build();

                    userRoleRepository.save(userRoleMapping);

                    Profile profile = Profile.builder()
                            .user(user)
                            .displayName(email.split("@")[0])
                            .build();

                    profileRepository.save(profile);
                }

                // Ensure an Oauth mapping exists for this provider/id pointing to the user
                if (oauthId != null) {
                    var existing = oauthRepository.findByProviderAndProviderId(provider, oauthId);
                    if (existing.isEmpty()) {
                        com.studentsocial.backend.model.Oauth oauth = com.studentsocial.backend.model.Oauth.builder()
                                .provider(provider)
                                .providerId(oauthId)
                                .user(user)
                                .build();
                        oauthRepository.save(oauth);
                    }
                }

                var userRoles = userRoleRepository.findByUserId(user.getId());
                List<String> roles = userRoles.stream()
                                .map(ur -> ur.getRole().getName())
                                .toList();

                String jwt = jwtService.generateToken(user.getEmail(), roles);

                final User finalUser = user;
String displayName = profileRepository.findByUserId(finalUser.getId())
        .map(p -> p.getDisplayName() != null
                ? p.getDisplayName()
                : finalUser.getEmail().split("@")[0])
        .orElse(finalUser.getEmail().split("@")[0]);

                return AuthResponse.builder()
                                .token(jwt)
                                .userId(user.getId())
                                .email(user.getEmail())
                                .displayName(displayName)
                                .roles(roles)
                                .build();
        }

        @Transactional
        public String forgotPassword(String email) {
                Optional<User> maybeUser = userRepository.findActiveByEmail(email);
                if (maybeUser.isEmpty()) {
                        // Do not reveal whether email exists; return empty for caller to treat as success
                        return null;
                }

                User user = maybeUser.get();
                String token = UUID.randomUUID().toString();
                user.setPasswordResetToken(token);
                user.setPasswordResetExpiresAt(LocalDateTime.now().plusHours(1));
                userRepository.save(user);
                // Attempt to send email with reset link. If mail not configured, still return token for testing.
                try {
                        String resetLink = frontendOrigin + "/reset-password?token=" + token;
                        emailService.sendPasswordReset(user.getEmail(), resetLink);
                        return null; // don't expose token when email was sent
                } catch (Exception ex) {
                        // If sending fails (dev env), return token so developer can continue testing.
                        return token;
                }
        }

        @Transactional
        public void resetPassword(String token, String newPassword) {
                Optional<User> maybeUser = userRepository.findByPasswordResetToken(token);
                if (maybeUser.isEmpty()) {
                        throw new RuntimeException("Invalid or expired token");
                }
                User user = maybeUser.get();
                if (user.getPasswordResetExpiresAt() == null || user.getPasswordResetExpiresAt().isBefore(LocalDateTime.now())) {
                        throw new RuntimeException("Invalid or expired token");
                }

                user.setPasswordHash(passwordEncoder.encode(newPassword));
                user.setPasswordResetToken(null);
                user.setPasswordResetExpiresAt(null);
                userRepository.save(user);
        }
}