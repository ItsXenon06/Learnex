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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.studentsocial.backend.model.Profile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

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

        user = userRepository.save(user);

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
}