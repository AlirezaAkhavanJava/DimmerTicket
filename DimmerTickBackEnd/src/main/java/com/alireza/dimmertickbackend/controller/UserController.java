package com.alireza.dimmertickbackend.controller;


import com.alireza.dimmertickbackend.domain.dto.*;
import com.alireza.dimmertickbackend.service.appUser.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Account endpoints.
 * For now the account is chosen by the {id} in the URL. When Spring Security arrives,
 * these will use the logged-in user instead (/api/users/me).
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * POST /api/users : create an account
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    /**
     * GET /api/users/{id} : see account details
     */
    @GetMapping("/{id}")
    public UserResponse get(@PathVariable UUID id) {
        return userService.getById(id);
    }

    /**
     * PUT /api/users/{id} : edit profile (name, email, birthdate)
     */
    @PutMapping("/{id}")
    public UserResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(id, request);
    }

    /**
     * PUT /api/users/{id}/password : change password
     */
    @PutMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@PathVariable UUID id, @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(id, request);
    }

    /**
     * DELETE /api/users/{id} : delete the account
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        userService.delete(id);
    }

    /**
     * GET /api/users/search?q=ali : find other users (for gifts)
     */
    @GetMapping("/search")
    public List<UserSummary> search(@RequestParam("q") String query) {
        return userService.search(query);
    }
}
