package com.alireza.dimmertickbackend.controller;

import com.alireza.dimmertickbackend.domain.dto.MovieResponse;
import com.alireza.dimmertickbackend.services.MoviesServices;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/movies")
public class MoviesController {

    private final MoviesServices moviesServices;

    @GetMapping
    public List<MovieResponse> findAll() {
        return moviesServices.findAll();
    }

}
