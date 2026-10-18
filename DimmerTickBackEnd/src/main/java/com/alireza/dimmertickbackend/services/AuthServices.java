package com.alireza.dimmertickbackend.services;

import com.alireza.dimmertickbackend.domain.dto.LoginRequest;
import com.alireza.dimmertickbackend.domain.dto.RegisterRequest;
import com.alireza.dimmertickbackend.domain.dto.UserResponse;

public interface AuthServices {

    UserResponse register(RegisterRequest request);

    UserResponse login(LoginRequest request);
}