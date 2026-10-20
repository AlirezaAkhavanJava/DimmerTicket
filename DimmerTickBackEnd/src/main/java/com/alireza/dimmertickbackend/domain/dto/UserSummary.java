package com.alireza.dimmertickbackend.domain.dto;


import com.alireza.dimmertickbackend.domain.AppUser;

import java.util.UUID;


public record UserSummary(
        UUID id,
        String username,
        String fullName
) {

    public static UserSummary from(AppUser user) {
        return new UserSummary(user.getId(), user.getUsername(), user.getFullName());
    }
}