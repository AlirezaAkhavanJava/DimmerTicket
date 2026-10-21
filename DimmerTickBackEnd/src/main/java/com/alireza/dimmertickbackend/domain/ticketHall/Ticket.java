package com.alireza.dimmertickbackend.domain.ticketHall;



import com.alireza.dimmertickbackend.domain.AppUser;
import com.alireza.dimmertickbackend.domain.movie.Showtime;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * One seat at one showtime, bought by one user.
 * Buying 3 seats creates 3 tickets.
 */
@Entity
@Table(
        name = "tickets",
        // The database itself refuses to sell the same seat twice for the same showtime.
        uniqueConstraints = @UniqueConstraint(
                name = "uk_tickets_showtime_seat",
                columnNames = {"showtime_id", "seat"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    /** Seat label from the seat map: row A-H plus number 1-10, for example "A5". */
    @Column(nullable = false, length = 5)
    private String seat;

    /** What the user paid. Copied from the showtime price, so later price changes don't touch old tickets. */
    @Column(name = "price_paid", nullable = false, precision = 8, scale = 2)
    private BigDecimal pricePaid;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();


}
