package com.alireza.dimmertickbackend.service;

import com.alireza.dimmertickbackend.domain.dto.MovieResponse;

import java.util.List;

public interface MovieService {
    List<MovieResponse> findAll();
}
