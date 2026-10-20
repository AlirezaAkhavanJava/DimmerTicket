package com.alireza.dimmertickbackend.domain.dto;

import com.alireza.dimmertickbackend.domain.AppUser;
import com.alireza.dimmertickbackend.domain.Role;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String fullName,
        String email,
        Role role
) {
        public static UserResponse from(AppUser user) {
                return new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getRole()
                );
        }
}