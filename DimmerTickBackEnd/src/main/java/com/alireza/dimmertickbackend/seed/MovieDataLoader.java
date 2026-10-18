package com.alireza.dimmertickbackend.seed;


import com.alireza.dimmertickbackend.domain.model.Movie;
import com.alireza.dimmertickbackend.repository.MoviesRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MovieDataLoader implements CommandLineRunner {

    private final MoviesRepository moviesRepository;
    private final tools.jackson.databind.ObjectMapper objectMapper;

    // Mirrors the keys in movies.json exactly, so Jackson can read them.
    private record SeedMovie(
            String title,
            String director,
            LocalDate release,
            String poster,
            String trailer,
            BigDecimal imdb,
            Integer rt,
            String duration,
            String genre,
            String age,
            String synopsis,
            List<String> cast,
            List<String> awards
    ) {
    }

    @Override
    public void run(String @NonNull ... args) throws Exception {
        // Only load when the table is empty, so restarts don't create duplicates.
        if (moviesRepository.count() > 0) {
            return;
        }

        try (InputStream in = new ClassPathResource("data/movies.json").getInputStream()) {
            List<SeedMovie> seeds = objectMapper.readValue(in, new TypeReference<>() {});
            List<Movie> movies = seeds.stream().map(this::toEntity).toList();
            moviesRepository.saveAll(movies);
            System.out.println("Loaded " + movies.size() + " movies");
        }
    }

    private Movie toEntity(SeedMovie s) {
        Movie m = new Movie();
        m.setTitle(s.title());
        m.setDirector(s.director());
        m.setReleaseDate(s.release());
        m.setPoster(s.poster());
        m.setTrailer(s.trailer());
        m.setImdb(s.imdb());
        m.setRottenTomatoes(s.rt());
        m.setDuration(s.duration());
        m.setGenre(s.genre());
        m.setAge(s.age());
        m.setSynopsis(s.synopsis());
        m.setCast(new java.util.ArrayList<>(s.cast()));
        m.setAwards(new java.util.ArrayList<>(s.awards()));
        return m;
    }
}