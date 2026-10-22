package com.alireza.dimmertickbackend.domain;

import com.alireza.dimmertickbackend.domain.stat.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "AppUsers")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(nullable = false, unique = true, updatable = false, length = 100)
    private String username;

    /**
     * A BCrypt hash, never the raw password. There is deliberately no toString() here.
     */
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(nullable = false, length = 250)
    private String fullName;

    /**
     * Needed for age-rated movies such as R.
     */
    @Column(nullable = false)
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }


    // Avatar
    /**
     * One of the keys in AvatarCatalog. Null for accounts created before avatars existed.
     */
    @Column(length = 40)
    private String avatar;

    /**
     * The agreement version this user accepted. Booking requires it to equal Terms.CURRENT_VERSION.
     */
    @Column(name = "terms_version", length = 20)
    private String termsVersion;

    @Column(name = "terms_accepted_at")
    private Instant termsAcceptedAt;

    // GEO
    @Column(name = "terms_ip", length = 64)
    private String termsIp;

    @Column(name = "terms_country", length = 16)
    private String termsCountry;
}