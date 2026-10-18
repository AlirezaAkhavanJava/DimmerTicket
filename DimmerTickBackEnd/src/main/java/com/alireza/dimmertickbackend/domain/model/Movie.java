package com.alireza.dimmertickbackend.domain.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "movies")
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 150)
    private String director;

    @Column(name = "release_date", nullable = false)
    private LocalDate releaseDate;

    @Column(nullable = false, length = 300)
    private String poster;

    @Column(nullable = false, length = 300)
    private String trailer;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal imdb;

    @Column(name = "rotten_tomatoes", nullable = false)
    private Integer rottenTomatoes;

    @Column(nullable = false, length = 20)
    private String duration;

    @Column(nullable = false, length = 100)
    private String genre;

    @Column(nullable = false, length = 10)
    private String age;

    @Column(nullable = false, length = 2000)
    private String synopsis;

    @ElementCollection
    @CollectionTable(name = "movie_cast", joinColumns = @JoinColumn(name = "movie_id"))
    @OrderColumn(name = "position")
    @Column(name = "actor", nullable = false, length = 150)
    private List<String> cast = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "movie_awards", joinColumns = @JoinColumn(name = "movie_id"))
    @OrderColumn(name = "position")
    @Column(name = "award", nullable = false, length = 200)
    private List<String> awards = new ArrayList<>();

    @OneToMany(mappedBy = "movie")
    private List<Ticket> tickets = new ArrayList<>();

    @ManyToMany(mappedBy = "movies")
    private List<UserAccount> users = new ArrayList<>();

}
