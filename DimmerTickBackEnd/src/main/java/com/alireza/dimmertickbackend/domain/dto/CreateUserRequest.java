package com.alireza.dimmertickbackend.domain.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateUserRequest(
        @NotBlank(message = "Full name is required.")
        @Size(max = 250)
        String fullName,

        @NotNull(message = "Date of birth is required.")
        @Past(message = "Date of birth cannot be in the future.")
        LocalDate birthDate,

        @NotBlank(message = "Username: 3 to 100 letters, digits or underscores.")
        @Pattern(regexp = "^[a-zA-Z0-9_]{3,100}$", message = "Username: 3 to 100 letters, digits or underscores.")
        String username,

        @NotBlank(message = "Enter a valid email address.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 250)
        String email,

        @NotBlank(message = "Use at least 8 characters.")
        @Size(min = 8, max = 72, message = "Use between 8 and 72 characters.")
        String password,

        @NotBlank(message = "Missing agreement version.")
        String termsVersion,

        @AssertTrue(message = "You must read and accept the Terms of Purchase and Use.")
        boolean termsAccepted
) {

        @Override
        public String toString() {
                return "CreateUserRequest[username=" + username + ", email=" + email + "]";
        }
}