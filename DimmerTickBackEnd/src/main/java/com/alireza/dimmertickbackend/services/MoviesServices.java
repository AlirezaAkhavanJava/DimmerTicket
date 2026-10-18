package com.alireza.dimmertickbackend.services;

import com.alireza.dimmertickbackend.domain.Movie;
import com.alireza.dimmertickbackend.domain.dto.MovieResponse;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface MoviesServices {


    List<MovieResponse> findAll();
}
