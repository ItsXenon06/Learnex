package com.studentsocial.backend.security;

import com.studentsocial.backend.model.User;
import com.studentsocial.backend.repository.UserRepository;
import com.studentsocial.backend.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Login attempt for unknown email: {}", email);
                    return new UsernameNotFoundException("User not found: " + email);
                });

        var userRoles = userRoleRepository.findByUserId(user.getId());

        // LW-2 FIX: previous log.info printed the raw password hash to stdout —
        // "password hash from DB: {bcrypt...}". Removed entirely.
        // Only log non-sensitive info at debug level.
        log.debug("Loaded user {} with {} role(s)", user.getEmail(), userRoles.size());

        return new CustomerUserDetails(user, userRoles);
    }
}