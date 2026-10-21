package com.alireza.dimmertickbackend.service.Movie;

import com.alireza.dimmertickbackend.domain.dto.MovieResponse;
import com.alireza.dimmertickbackend.repository.MovieRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService {
    private final MovieRepository movieRepository;


    /**
     * All movies, sorted by id so the order never changes between requests
     * (the hero slider shows the first six).
     * readOnly = true keeps the database session open while we convert,
     * which is what lets us read the lazy cast and awards lists.
     */
    @Transactional(readOnly = true)
    public List<MovieResponse> findAll() {
        return movieRepository.findAll(Sort.by("id"))
                .stream()
                .map(MovieResponse::from)
                .toList();
    }
}




