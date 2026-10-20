package com.alireza.dimmertickbackend.controller;

import com.alireza.dimmertickbackend.domain.dto.MovieResponse;
import com.alireza.dimmertickbackend.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/{userId}/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    /** GET: Get all saved movies for this user */
    @GetMapping
    public List<MovieResponse> getWatchlist(@PathVariable UUID userId) {
        return watchlistService.getUserWatchlist(userId);
    }

    /** POST: Add a movie to the list */
    @PostMapping("/{movieId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void add(@PathVariable UUID userId, @PathVariable Long movieId) {
        watchlistService.addToWatchlist(userId, movieId);
    }

    /** DELETE: Remove a movie from the list */
    @DeleteMapping("/{movieId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable UUID userId, @PathVariable Long movieId) {
        watchlistService.removeFromWatchlist(userId, movieId);
    }
}