package com.alireza.dimmertickbackend.domain.dto.booking;

import com.alireza.dimmertickbackend.domain.stat.SeatTier;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public final class BookingDtos {

    private BookingDtos() {
    }

    /** One seat on the map. status is FREE, HELD (reserved by someone paying) or SOLD. */
    public record SeatView(String label, String row, int number, SeatTier tier, BigDecimal price, String status) {
    }

    public record SeatMap(Long showtimeId, String movie, String cinema, String hall, LocalDateTime startsAt,
                          int total, int sold, int held, int free, List<SeatView> seats) {
    }

    public record HoldRequest(
            @NotEmpty(message = "Choose at least one seat.")
            @Size(max = 8, message = "You can hold up to 8 seats at a time.")
            List<@NotBlank @Pattern(regexp = "^[A-Za-z][0-9]{1,2}$", message = "Invalid seat.") String> seats
    ) {
    }

    public record HoldResponse(Long showtimeId, List<String> seats, BigDecimal total, Instant expiresAt) {
    }

    /** A showtime listed for a movie on one day. fromPrice is the base price before seat-tier fees. */
    public record ShowtimeItem(Long id, Long movieId, String cinema, String hall,
                               LocalDateTime startsAt, BigDecimal fromPrice) {
    }

    /** Live numbers for one movie across its upcoming showtimes. */
    public record SellingFastItem(Long movieId, String title, int totalSeats, int sold, int held,
                                  int remaining, int soldLastHour, int percentSold) {
    }
}