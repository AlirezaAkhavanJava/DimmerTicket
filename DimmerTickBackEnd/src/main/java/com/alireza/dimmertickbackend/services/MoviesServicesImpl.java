package com.alireza.dimmertickbackend.services;

import com.alireza.dimmertickbackend.domain.dto.MovieResponse;
import com.alireza.dimmertickbackend.domain.mapper.MovieMapper;
import com.alireza.dimmertickbackend.repository.MoviesRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.stereotype.Service;

import java.util.List;

@RequiredArgsConstructor
@Service
public class MoviesServicesImpl implements MoviesServices {

    private final MoviesRepository moviesRepository;
    private final MovieMapper mapper;


    @Override
    @Transactional
    @ReadOnlyProperty
    public List<MovieResponse> findAll() {
        return mapper.toResponseList(moviesRepository.findAll());
    }
}
