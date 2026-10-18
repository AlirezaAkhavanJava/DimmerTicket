package com.alireza.dimmertickbackend.domain.dto;



import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.URL;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record MovieResponse(

        @NotNull
        @Positive
        Long id,

        @NotBlank
        @Size(max = 200)
        String title,

        @NotBlank
        @Size(max = 150)
        String director,

        @NotNull
        LocalDate releaseDate,

        @NotBlank
        String poster,

        @NotBlank
        @URL
        String trailer,

        @NotNull
        @DecimalMin("0.0")
        @DecimalMax("10.0")
        BigDecimal imdb,

        @NotNull
        @Min(0)
        @Max(100)
        Integer rottenTomatoes,

        @NotBlank
        String duration,

        @NotBlank
        @Size(max = 100)
        String genre,

        @NotBlank
        @Size(max = 10)
        String age,

        @NotBlank
        @Size(max = 2000)
        String synopsis,

        @NotNull
        List<@NotBlank String> cast,

        @NotNull
        List<@NotBlank String> awards

) {
}