package com.alireza.dimmertickbackend.repository;

import com.alireza.dimmertickbackend.domain.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MoviesRepository extends JpaRepository<Movie, Long> {

}
