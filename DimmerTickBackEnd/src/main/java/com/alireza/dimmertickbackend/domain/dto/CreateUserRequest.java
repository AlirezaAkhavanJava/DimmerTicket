package com.alireza.dimmertickbackend.domain.dto;


import jakarta.validation.constraints.*;

import java.time.LocalDate;

/**
 * What a person sends to create an account.
 */
public record CreateUserRequest(

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 30, message = "Username must be 3 to 30 characters")
        @Pattern(regexp = "^[A-Za-z0-9_]+$", message = "Username can only use letters, numbers and _")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Email is not valid")
        @Size(max = 255, message = "Email is too long")
        String email,

        // BCrypt only reads the first 72 characters, so we stop there
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be 8 to 72 characters")
        String password,

        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be 2 to 100 characters")
        String fullName,

        @NotNull(message = "Birth date is required")
        @Past(message = "Birth date must be in the past")
        LocalDate birthDate
) {
}