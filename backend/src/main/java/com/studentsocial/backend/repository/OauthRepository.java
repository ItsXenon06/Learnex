package com.studentsocial.backend.repository;

import com.studentsocial.backend.model.Oauth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OauthRepository extends JpaRepository<Oauth, UUID> {
    Optional<Oauth> findByProviderAndProviderId(String provider, String providerId);
}
