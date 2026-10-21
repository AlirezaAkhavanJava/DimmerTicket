package com.alireza.dimmertickbackend.controller.user;

import com.alireza.dimmertickbackend.domain.AppUser;
import com.alireza.dimmertickbackend.domain.dto.*;
import com.alireza.dimmertickbackend.domain.legal.Terms;
import com.alireza.dimmertickbackend.repository.AppUserRepository;
import com.alireza.dimmertickbackend.service.appUser.UserService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

/** Endpoints for the signed-in user's own account. Everything here needs a login. */
@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final UserService userService;
    private final AppUserRepository userRepository;

    @GetMapping
    public UserResponse me(Authentication auth) {
        return userService.getById(currentUserId(auth));
    }

    @PutMapping
    public UserResponse update(Authentication auth, @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(currentUserId(auth), request);
    }

    @PutMapping("/avatar")
    public UserResponse avatar(Authentication auth, @Valid @RequestBody AvatarRequest request) {
        return userService.setAvatar(currentUserId(auth), request.avatar());
    }

    @PostMapping("/password")
    public ResponseEntity<Void> password(Authentication auth, @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUserId(auth), request);
        return ResponseEntity.noContent().build();
    }

    /** The login name is the email, so find the account it belongs to. */
    private UUID currentUserId(Authentication auth) {
        return userRepository.findByEmailIgnoreCase(auth.getName())
                .map(AppUser::getId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Your session has ended. Log in again."));
    }

    /** Records that the signed-in user accepted the agreement version shown on /terms. */
    @PostMapping("/terms")
    @Transactional
    public UserResponse acceptTerms(Authentication auth, @Valid @RequestBody AcceptTermsRequest request) {
        if (!Terms.CURRENT_VERSION.equals(request.version())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The agreement has changed. Reload the page and read the new version.");
        }
        AppUser user = userRepository.findById(currentUserId(auth))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Log in again."));
        user.setTermsVersion(Terms.CURRENT_VERSION);
        user.setTermsAcceptedAt(Instant.now());
        return UserResponse.from(userRepository.save(user));
    }
}