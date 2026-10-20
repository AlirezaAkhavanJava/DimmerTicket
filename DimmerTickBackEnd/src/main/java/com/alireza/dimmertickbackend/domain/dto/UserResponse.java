package com.alireza.dimmertickbackend.domain.dto;

import com.alireza.dimmertickbackend.domain.AppUser;
import com.alireza.dimmertickbackend.domain.Role;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/** A user's own account details. There is no password field, so it can never leak. */
public record UserResponse(
        UUID id,
        String username,
        String email,
        String fullName,
        LocalDate birthDate,
        Role role,
        LocalDateTime createdAt
) {

        public static UserResponse from(AppUser user) {
                return new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getBirthDate(),
                        user.getRole(),
                        user.getCreatedAt()
                );
        }
}