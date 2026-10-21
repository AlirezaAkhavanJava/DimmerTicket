package com.alireza.dimmertickbackend.service.watchlist;

import com.alireza.dimmertickbackend.domain.AppUser;
import com.alireza.dimmertickbackend.domain.movie.Movie;
import com.alireza.dimmertickbackend.domain.movie.WatchlistItem;
import com.alireza.dimmertickbackend.domain.dto.MovieResponse;
import com.alireza.dimmertickbackend.repository.AppUserRepository;
import com.alireza.dimmertickbackend.repository.MovieRepository;
import com.alireza.dimmertickbackend.repository.WatchlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WatchlistServiceImpl implements WatchlistService {

    private final WatchlistItemRepository watchlistRepo;
    private final AppUserRepository userRepo;
    private final MovieRepository movieRepo;

    @Override
    @Transactional(readOnly = true)
    public List<MovieResponse> getUserWatchlist(UUID userId) {
        if (!userRepo.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        return watchlistRepo.findAllByUserId(userId).stream()
                .map(item -> MovieResponse.from(item.getMovie()))
                .toList();
    }

    @Override
    @Transactional
    public void addToWatchlist(UUID userId, Long movieId) {
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Movie movie = movieRepo.findById(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

        if (watchlistRepo.findByUserIdAndMovieId(userId, movieId).isPresent()) {
            return; // Already in list, do nothing
        }

        WatchlistItem item = new WatchlistItem();
        item.setUser(user);
        item.setMovie(movie);
        watchlistRepo.save(item);
    }

    @Override
    @Transactional
    public void removeFromWatchlist(UUID userId, Long movieId) {
        watchlistRepo.findByUserIdAndMovieId(userId, movieId)
                .ifPresent(watchlistRepo::delete);
    }
}