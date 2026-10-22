package com.alireza.dimmertickbackend.service.appUser;

import com.alireza.dimmertickbackend.domain.dto.*;
import com.alireza.dimmertickbackend.service.geo.GeoService;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserResponse create(CreateUserRequest request, GeoService.ClientInfo client);

    UserResponse getById(UUID id);

    UserResponse update(UUID id, @Valid UpdateUserRequest request);

    void changePassword(UUID id, @Valid ChangePasswordRequest request);

    void delete(UUID id);

    List<UserSummary> search(String query);

    UserResponse setAvatar(UUID id, String avatar);

    UserResponse acceptTerms(UUID id, String version, GeoService.ClientInfo client);
}
