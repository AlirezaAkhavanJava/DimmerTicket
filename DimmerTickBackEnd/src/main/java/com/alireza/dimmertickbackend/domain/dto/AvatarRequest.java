package com.alireza.dimmertickbackend.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AvatarRequest(
        @NotBlank(message = "Choose an avatar.")
        @Size(max = 40)
        String avatar
) {
}