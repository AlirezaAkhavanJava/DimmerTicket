package com.alireza.dimmertickbackend.domain.mapper;

import com.alireza.dimmertickbackend.domain.dto.RegisterRequest;
import com.alireza.dimmertickbackend.domain.dto.UserResponse;
import com.alireza.dimmertickbackend.domain.model.UserAccount;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    // The service decides the email and the hash, so they're passed in explicitly.
    // The mapper only copies the fields.
    public UserAccount toEntity(RegisterRequest request, String normalizedEmail, String passwordHash) {
        UserAccount user = new UserAccount();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setUsername(request.username().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordHash);
        return user;
    }

    public UserResponse toResponse(UserAccount user) {
        return new UserResponse(
                user.getFirstName(),
                user.getLastName(),
                user.getUsername(),
                user.getEmail()
        );
    }
}