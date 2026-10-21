package com.alireza.dimmertickbackend.controller.watchlist;

import com.alireza.dimmertickbackend.domain.AppUser;
import com.alireza.dimmertickbackend.domain.dto.MovieResponse;
import com.alireza.dimmertickbackend.repository.AppUserRepository;
import com.alireza.dimmertickbackend.service.watchlist.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;
    private final AppUserRepository userRepository;

    /** The signed-in user's saved movies. */
    @GetMapping
    public List<MovieResponse> mine(Authentication auth) {
        return watchlistService.getUserWatchlist(currentUserId(auth));
    }

    @PostMapping("/{movieId}")
    public ResponseEntity<Void> add(Authentication auth, @PathVariable Long movieId) {
        watchlistService.addToWatchlist(currentUserId(auth), movieId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{movieId}")
    public ResponseEntity<Void> remove(Authentication auth, @PathVariable Long movieId) {
        watchlistService.removeFromWatchlist(currentUserId(auth), movieId);
        return ResponseEntity.noContent().build();
    }

    /** The login name is the email, so look up the account it belongs to. */
    private UUID currentUserId(Authentication auth) {
        return userRepository.findByEmailIgnoreCase(auth.getName())
                .map(AppUser::getId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Log in to use your watchlist."));
    }
}