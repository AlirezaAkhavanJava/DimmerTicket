package com.alireza.dimmertickbackend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "showtimes")
public class Showtime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many showtimes belong to one movie. LAZY = the movie is loaded only when needed.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cinema_id", nullable = false)
    private Cinema cinema;

    /**
     * Local time at the cinema, for example 2026-10-24T17:00.
     */
    @Column(name = "starts_at", nullable = false)
    private LocalDateTime startsAt;

    /**
     * Price of one seat. BigDecimal is exact, so there are no rounding surprises with money.
     */
    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal price;
}