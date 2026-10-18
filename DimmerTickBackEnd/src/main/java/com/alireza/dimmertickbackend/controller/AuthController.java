package com.alireza.dimmertickbackend.controller;

import com.alireza.dimmertickbackend.domain.dto.AuthResponse;
import com.alireza.dimmertickbackend.domain.dto.LoginRequest;
import com.alireza.dimmertickbackend.domain.dto.RegisterRequest;
import com.alireza.dimmertickbackend.domain.dto.UserResponse;
import com.alireza.dimmertickbackend.services.AuthServices;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthServices authServices;

    // @Valid runs the validation annotations on the DTO before this method is called.
    // If they fail, ApiExceptionHandler responds with 400 and never reaches the service.
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse user = authServices.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return new AuthResponse(authServices.login(request));
    }
}