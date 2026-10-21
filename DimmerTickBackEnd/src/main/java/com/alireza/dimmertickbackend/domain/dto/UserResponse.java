package com.alireza.dimmertickbackend.domain.dto;

import com.alireza.dimmertickbackend.domain.AppUser;
import com.alireza.dimmertickbackend.domain.AvatarCatalog;
import com.alireza.dimmertickbackend.domain.legal.Terms;
import com.alireza.dimmertickbackend.domain.stat.Role;

import java.time.LocalDate;
import java.util.UUID;

/** What the browser may see about an account. The password hash is never included. */
public record UserResponse(
        UUID id,
        String username,
        String fullName,
        String email,
        LocalDate birthDate,
        Role role,
        String avatar,
        boolean termsAccepted
) {
        public static UserResponse from(AppUser user) {
                return new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getBirthDate(),
                        user.getRole(),
                        user.getAvatar() != null ? user.getAvatar() : AvatarCatalog.DEFAULT,
                        Terms.CURRENT_VERSION.equals(user.getTermsVersion())
                );
        }
}