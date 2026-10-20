package com.alireza.dimmertickbackend.controller;

import com.alireza.dimmertickbackend.domain.dto.MovieResponse;
import com.alireza.dimmertickbackend.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    /**
     * GET /api/movies returns every movie as a JSON array.
     */
    @GetMapping
    public List<MovieResponse> getMovies() {
        return movieService.findAll();
    }
}