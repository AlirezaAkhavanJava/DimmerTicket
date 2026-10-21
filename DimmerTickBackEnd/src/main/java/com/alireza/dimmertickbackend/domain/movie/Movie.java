package com.alireza.dimmertickbackend.domain.movie;

import com.alireza.dimmertickbackend.domain.stat.MovieStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * A movie that can be booked.
 * One Movie object = one row in the "movies" table.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "movies")
public class Movie {

    // ---------- primary key ----------

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)   // PostgreSQL creates the id for us
    private Long id;

    // ---------- basic info ----------

    @Column(nullable = false, length = 200)
    private String title;

    /**
     * TMDB image path, for example "/abc123.jpg" (the front-end adds the CDN address).
     */
    @Column(length = 200)
    private String poster;

    /**
     * Genres in one text value, for example "Action, Drama".
     */
    @Column(nullable = false, length = 200)
    private String genre;

    /**
     * Age rating, for example "PG-13" or "R".
     */
    @Column(nullable = false, length = 10)
    private String age;

    @Column(length = 200)
    private String director;

    /**
     * Runtime as shown on the page, for example "180 Min".
     */
    @Column(length = 30)
    private String duration;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(columnDefinition = "text")
    private String synopsis;

    /**
     * YouTube embed link. Empty when there is no trailer yet.
     */
    @Column(length = 300)
    private String trailer;

    // ---------- ratings ----------

    private Double imdb;

    @Column(name = "rotten_tomatoes")
    private Integer rottenTomatoes;

    // ---------- lists (each one gets its own small table) ----------

    @ElementCollection

    @CollectionTable(name = "movie_cast", joinColumns = @JoinColumn(name = "movie_id"))
    @OrderColumn(name = "position")                       // keeps the lead actor first
    @Column(name = "actor_name", nullable = false, length = 200)
    private List<String> cast = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "movie_awards", joinColumns = @JoinColumn(name = "movie_id"))
    @OrderColumn(name = "position")
    @Column(name = "award", nullable = false, length = 300)
    private List<String> awards = new ArrayList<>();

    // ADMIN PANEL AND HERO SLIDER
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MovieStatus status = MovieStatus.DRAFT;

    /** null = not in the hero. 1, 2, 3... = position in the slider. */
    @Column(name = "hero_position")
    private Integer heroPosition;


}