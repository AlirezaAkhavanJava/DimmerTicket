package com.alireza.dimmertickbackend.services;

import com.alireza.dimmertickbackend.domain.dto.MovieResponse;

import java.util.List;

public interface MoviesServices {


    List<MovieResponse> findAll();
}
