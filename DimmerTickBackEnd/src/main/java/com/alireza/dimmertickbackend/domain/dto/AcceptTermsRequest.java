package com.alireza.dimmertickbackend.domain.dto;

import jakarta.validation.constraints.NotBlank;

public record AcceptTermsRequest(
        @NotBlank(message = "Missing agreement version.")
        String version
) {
}