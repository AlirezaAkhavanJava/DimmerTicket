package com.alireza.dimmertickbackend.controller;

import com.alireza.dimmertickbackend.domain.dto.CreateUserRequest;
import com.alireza.dimmertickbackend.domain.dto.LoginRequest;
import com.alireza.dimmertickbackend.domain.dto.UserResponse;
import com.alireza.dimmertickbackend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest request) {
        return userService.login(request.email(), request.password());
    }
}