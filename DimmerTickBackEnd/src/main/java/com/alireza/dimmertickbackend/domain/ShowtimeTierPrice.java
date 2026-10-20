package com.alireza.dimmertickbackend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/** The extra amount a seat tier costs for one showtime. STANDARD usually has 0. */
@Entity
@Table(
        name = "showtime_tier_prices",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_showtime_tier",
                columnNames = {"showtime_id", "tier"})
)
@Getter
@Setter
@NoArgsConstructor
public class ShowtimeTierPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SeatTier tier;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal surcharge;
}