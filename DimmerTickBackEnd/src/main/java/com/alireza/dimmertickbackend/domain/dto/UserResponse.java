package com.alireza.dimmertickbackend.domain.dto;

public record UserResponse(
        String firstName,
        String lastName,
        String username,
        String email
) {
}