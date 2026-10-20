package com.alireza.dimmertickbackend.service;

import com.alireza.dimmertickbackend.domain.dto.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserResponse create(@Valid CreateUserRequest request);

    UserResponse getById(UUID id);

    UserResponse update(UUID id, @Valid UpdateUserRequest request);

    void changePassword(UUID id, @Valid ChangePasswordRequest request);

    void delete(UUID id);

    List<UserSummary> search(String query);
}
