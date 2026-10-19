package com.alireza.dimmertickbackend;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    @GetMapping(produces = "application/json")
    public Resource getMovies() {
        return new ClassPathResource("data/movies.json");
    }
}
