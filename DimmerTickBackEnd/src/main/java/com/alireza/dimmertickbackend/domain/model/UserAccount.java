package com.alireza.dimmertickbackend.domain.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "user_accounts")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    @Setter(AccessLevel.NONE)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    // Holds a BCrypt hash
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 250)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 250)
    private String lastName;

    @Column(nullable = false, unique = true, length = 250)
    private String email;

    @ManyToMany
    @JoinTable(
            name = "user_watchlist",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "movie_id")
    )
    private List<Movie> movies = new ArrayList<>();

    @OneToMany(mappedBy = "owner")
    private List<Ticket> tickets = new ArrayList<>();
}