package com.alireza.dimmertickbackend.service.Movie;

import com.alireza.dimmertickbackend.domain.dto.MovieResponse;

import java.util.List;

public interface MovieService {
    List<MovieResponse> findAll();
}
