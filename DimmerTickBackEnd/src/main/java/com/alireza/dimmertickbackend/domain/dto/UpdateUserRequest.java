package com.alireza.dimmertickbackend.domain.dto;


import jakarta.validation.constraints.*;

import java.time.LocalDate;

/**
 * What a user may change about their own profile.
 * Not here on purpose: username (fixed), role (only an admin may change it), password (own endpoint).
 */
public record UpdateUserRequest(

        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be 2 to 100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email is not valid")
        @Size(max = 255, message = "Email is too long")
        String email,

        @NotNull(message = "Birth date is required")
        @Past(message = "Birth date must be in the past")
        LocalDate birthDate
) {
}