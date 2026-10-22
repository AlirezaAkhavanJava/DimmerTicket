package com.alireza.dimmertickbackend.service.appUser;

import com.alireza.dimmertickbackend.domain.AppUser;
import com.alireza.dimmertickbackend.domain.AvatarCatalog;
import com.alireza.dimmertickbackend.domain.dto.*;
import com.alireza.dimmertickbackend.domain.legal.Terms;
import com.alireza.dimmertickbackend.domain.stat.Role;
import com.alireza.dimmertickbackend.repository.AppUserRepository;
import com.alireza.dimmertickbackend.repository.WatchlistItemRepository;
import com.alireza.dimmertickbackend.service.geo.GeoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final int MIN_SEARCH_LENGTH = 2;
    private static final int MAX_SEARCH_RESULTS = 10;

    private final AppUserRepository userRepository;
    private final WatchlistItemRepository watchlistItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserResponse create(CreateUserRequest request, GeoService.ClientInfo client) {
        if (!Terms.CURRENT_VERSION.equals(request.termsVersion())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The agreement has changed. Reload the page and read the new version.");
        }

        String username = request.username().trim().toLowerCase();
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This username is already taken");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        AppUser user = new AppUser();
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(request.fullName().trim());
        user.setBirthDate(request.birthDate());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        user.setAvatar(AvatarCatalog.DEFAULT);
        recordAcceptance(user, Terms.CURRENT_VERSION, client);

        return UserResponse.from(userRepository.saveAndFlush(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getById(UUID id) {
        return UserResponse.from(findUser(id));
    }

    @Override
    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest request) {
        AppUser user = findUser(id);
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Another account already uses this email");
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setBirthDate(request.birthDate());

        return UserResponse.from(userRepository.saveAndFlush(user));
    }

    @Override
    @Transactional
    public void changePassword(UUID id, ChangePasswordRequest request) {
        AppUser user = findUser(id);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.saveAndFlush(user);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        AppUser user = findUser(id);

        watchlistItemRepository.deleteByUserId(id);   // saved movies go with the account
        userRepository.delete(user);
        userRepository.flush();                       // run the SQL now, so a blocked delete fails here
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummary> search(String query) {
        String text = query == null ? "" : query.trim();
        if (text.length() < MIN_SEARCH_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Type at least " + MIN_SEARCH_LENGTH + " characters to search");
        }

        return userRepository
                .findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(
                        text, text, PageRequest.of(0, MAX_SEARCH_RESULTS, Sort.by("username")))
                .stream()
                .map(UserSummary::from)
                .toList();
    }

    @Override
    @Transactional
    public UserResponse setAvatar(UUID id, String avatar) {
        if (!AvatarCatalog.isValid(avatar)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That avatar does not exist.");
        }
        AppUser user = findUser(id);
        user.setAvatar(avatar);
        return UserResponse.from(userRepository.saveAndFlush(user));
    }

    private AppUser findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    @Transactional
    public UserResponse acceptTerms(UUID id, String version, GeoService.ClientInfo client) {
        if (!Terms.CURRENT_VERSION.equals(version)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The agreement has changed. Reload the page and read the new version.");
        }
        AppUser user = findUser(id);
        recordAcceptance(user, Terms.CURRENT_VERSION, client);
        return UserResponse.from(userRepository.saveAndFlush(user));
    }

    /** Stores when, from which IP and country, and which version the user accepted. */
    private void recordAcceptance(AppUser user, String version, GeoService.ClientInfo client) {
        user.setTermsVersion(version);
        user.setTermsAcceptedAt(Instant.now());
        user.setTermsIp(client.ip());
        user.setTermsCountry(client.country());
    }
}