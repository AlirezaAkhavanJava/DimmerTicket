package com.alireza.dimmertickbackend.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "First name is required.")
        @Size(max = 250)
        String firstName,

        @NotBlank(message = "Last name is required.")
        @Size(max = 250)
        String lastName,

        @NotBlank(message = "Username: 3 to 100 letters, digits or underscores.")
        @Pattern(regexp = "^[a-zA-Z0-9_]{3,100}$",
                message = "Username: 3 to 100 letters, digits or underscores.")
        String username,

        @NotBlank(message = "Enter a valid email address.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 250)
        String email,

        // BCrypt only reads the first 72 bytes of a password, so longer input adds no security.
        @NotBlank(message = "Use at least 8 characters.")
        @Size(min = 8, max = 72, message = "Use between 8 and 72 characters.")
        String password

) {

    // A record's generated toString() prints every component, including the password.
    // Logging a request would leak it, so only show the fields that are safe to log.
    @Override
    public String toString() {
        return "RegisterRequest[username=" + username + ", email=" + email + "]";
    }
}