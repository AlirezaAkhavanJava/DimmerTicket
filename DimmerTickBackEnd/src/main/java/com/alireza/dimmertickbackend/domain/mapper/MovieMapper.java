package com.alireza.dimmertickbackend.domain.mapper;

import com.alireza.dimmertickbackend.domain.Movie;
import com.alireza.dimmertickbackend.domain.dto.MovieResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MovieMapper {

    public MovieResponse toResponse(Movie movie) {
        return new MovieResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getDirector(),
                movie.getReleaseDate(),
                movie.getPoster(),
                movie.getTrailer(),
                movie.getImdb(),
                movie.getRottenTomatoes(),
                movie.getDuration(),
                movie.getGenre(),
                movie.getAge(),
                movie.getSynopsis(),
                List.copyOf(movie.getCast()),
                List.copyOf(movie.getAwards())
        );
    }

    public List<MovieResponse> toResponseList(List<Movie> movies) {
        return movies.stream()
                .map(this::toResponse)
                .toList();
    }
}
