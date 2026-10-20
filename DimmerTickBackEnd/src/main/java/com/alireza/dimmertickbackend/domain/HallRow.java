package com.alireza.dimmertickbackend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One row of seats in a hall, for example row A with 10 seats in the VIP tier. */
@Entity
@Table(
        name = "hall_rows",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_hall_row_label",
                columnNames = {"hall_id", "row_label"})
)
@Getter
@Setter
@NoArgsConstructor
public class HallRow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hall_id", nullable = false)
    private Hall hall;

    /** One letter, for example "A". Seat labels are built from this: "A1", "A2"... */
    @Column(name = "row_label", nullable = false, length = 1)
    private String rowLabel;

    @Column(name = "seat_count", nullable = false)
    private int seatCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SeatTier tier;
}