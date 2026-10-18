package com.alireza.dimmertickbackend.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @NotBlank(message = "Enter a valid email address.")
        @Email(message = "Enter a valid email address.")
        String email,

        @NotBlank(message = "Enter your password.")
        String password

) {

    @Override
    public String toString() {
        return "LoginRequest[email=" + email + "]";
    }
}