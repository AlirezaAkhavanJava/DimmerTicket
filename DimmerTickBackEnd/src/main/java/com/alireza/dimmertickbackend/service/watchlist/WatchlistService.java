package com.alireza.dimmertickbackend.service.watchlist;

import com.alireza.dimmertickbackend.domain.dto.MovieResponse;

import java.util.List;
import java.util.UUID;

public interface WatchlistService {
    List<MovieResponse> getUserWatchlist(UUID userId);
    void addToWatchlist(UUID userId, Long movieId);
    void removeFromWatchlist(UUID userId, Long movieId);
}
