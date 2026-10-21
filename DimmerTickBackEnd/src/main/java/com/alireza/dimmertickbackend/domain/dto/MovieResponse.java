package com.alireza.dimmertickbackend.domain.dto;



import com.alireza.dimmertickbackend.domain.movie.Movie;

import java.time.LocalDate;
import java.util.List;


/**
 * The movie as the front-end sees it.
 * The field names here become the JSON keys, so they must match what app.js reads.
 */

public record MovieResponse(
        Long id,
        String title,
        String poster,
        String genre,
        String age,
        Double imdb,
        Integer rottenTomatoes,
        LocalDate releaseDate,
        String duration,
        String director,
        String synopsis,
        String trailer,
        List<String> cast,
        List<String> awards
) {

    /**
     * Converts a Movie entity into a response.
     * Call this inside a transaction: cast and awards are loaded lazily, and List.copyOf reads them.
     */
    public static MovieResponse from(Movie movie) {
        return new MovieResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getPoster(),
                movie.getGenre(),
                movie.getAge(),
                movie.getImdb(),
                movie.getRottenTomatoes(),
                movie.getReleaseDate(),
                movie.getDuration(),
                movie.getDirector(),
                movie.getSynopsis(),
                movie.getTrailer(),
                List.copyOf(movie.getCast()),
                List.copyOf(movie.getAwards())
        );
    }
}