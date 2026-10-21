package com.alireza.dimmertickbackend.controller.booking;

import com.alireza.dimmertickbackend.domain.AppUser;
import com.alireza.dimmertickbackend.domain.dto.booking.BookingDtos.HoldRequest;
import com.alireza.dimmertickbackend.domain.dto.booking.BookingDtos.HoldResponse;
import com.alireza.dimmertickbackend.domain.dto.booking.BookingDtos.SeatMap;
import com.alireza.dimmertickbackend.domain.dto.booking.BookingDtos.SellingFastItem;
import com.alireza.dimmertickbackend.domain.dto.booking.BookingDtos.ShowtimeItem;
import com.alireza.dimmertickbackend.domain.legal.Terms;
import com.alireza.dimmertickbackend.repository.AppUserRepository;
import com.alireza.dimmertickbackend.service.booking.SeatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class BookingController {

    private final SeatService seats;
    private final AppUserRepository userRepository;

    // ---- public (browsing) ----

    @GetMapping("/api/movies/{movieId}/showtimes")
    public List<ShowtimeItem> showtimes(@PathVariable Long movieId,
                                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return seats.showtimesFor(movieId, date);
    }

    @GetMapping("/api/showtimes/{id}/seats")
    public SeatMap seatMap(@PathVariable Long id) {
        return seats.seatMap(id);
    }

    @GetMapping("/api/stats/selling-fast")
    public List<SellingFastItem> sellingFast() {
        return seats.sellingFast();
    }

    // ---- signed in and agreed to the terms ----

    @PostMapping("/api/showtimes/{id}/holds")
    public HoldResponse hold(@PathVariable Long id, Authentication auth, @Valid @RequestBody HoldRequest request) {
        AppUser user = currentUser(auth);
        if (!Terms.CURRENT_VERSION.equals(user.getTermsVersion())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Accept the current Terms of Purchase and Use before booking.");
        }
        return seats.hold(id, user.getId(), request.seats());
    }

    @PostMapping("/api/showtimes/{id}/holds/release")
    public ResponseEntity<Void> release(@PathVariable Long id, Authentication auth,
                                        @Valid @RequestBody HoldRequest request) {
        seats.release(id, currentUser(auth).getId(), request.seats());
        return ResponseEntity.noContent().build();
    }

    private AppUser currentUser(Authentication auth) {
        return userRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Log in to continue."));
    }
}