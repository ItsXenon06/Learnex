package com.studentsocial.backend.config;

import com.studentsocial.backend.security.CustomerUserDetailsService;
import com.studentsocial.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomerUserDetailsService customerUserDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth

                // ── Public: auth endpoints (no token needed) ──────────────
                .requestMatchers("/api/auth/**").permitAll()

                // ── Public: read-only content (guests can browse) ─────────
                .requestMatchers(HttpMethod.GET, "/api/posts/discover").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/posts/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/posts/{id}/reactions").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/posts/{id}/comments").permitAll()

                // ── Authenticated: everything else ────────────────────────
                // This covers:
                //   POST   /api/posts                   (create post)
                //   DELETE /api/posts/{id}              (delete post)
                //   GET    /api/posts/feed              (personalised feed)
                //   POST   /api/posts/{id}/reactions    (like)
                //   DELETE /api/posts/{id}/reactions    (unlike)
                //   POST   /api/posts/{id}/comments     (comment)
                //   DELETE /api/comments/{id}           (delete comment)
                //   POST   /api/comments/{id}/reactions (react to comment)
                //   DELETE /api/comments/{id}/reactions (remove comment reaction)
                //   GET    /api/users/**                (profile, saved posts)
                //   PUT    /api/users/**                (update profile)
                //   GET/POST /api/conversations/**      (messaging)
                //   GET    /api/notifications/**
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customerUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}