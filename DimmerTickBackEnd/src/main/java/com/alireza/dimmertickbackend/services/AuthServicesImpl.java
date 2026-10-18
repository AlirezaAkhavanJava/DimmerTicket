package com.alireza.dimmertickbackend.services;

import com.alireza.dimmertickbackend.domain.dto.LoginRequest;
import com.alireza.dimmertickbackend.domain.dto.RegisterRequest;
import com.alireza.dimmertickbackend.domain.dto.UserResponse;
import com.alireza.dimmertickbackend.domain.mapper.UserMapper;
import com.alireza.dimmertickbackend.domain.model.UserAccount;
import com.alireza.dimmertickbackend.exception.DuplicateAccountException;
import com.alireza.dimmertickbackend.exception.InvalidCredentialsException;
import com.alireza.dimmertickbackend.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthServicesImpl implements AuthServices {

    private final UserAccountRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    // A hash of a random value, computed once at startup. When the email is unknown,
    // login still runs one BCrypt check against this hash. Without it, a fast "no such
    // user" reply would let an attacker find which emails are registered by timing requests.
    private final String dummyHash;

    public AuthServicesImpl(UserAccountRepository userRepository,
                            UserMapper userMapper,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.dummyHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String username = request.username().trim();

        if (userRepository.existsByEmail(email) || userRepository.existsByUsername(username)) {
            throw new DuplicateAccountException("That email or username is already in use.");
        }

        // Only the hash is stored. The raw password is discarded after this line.
        String hash = passwordEncoder.encode(request.password());
        UserAccount saved = userRepository.save(userMapper.toEntity(request, email, hash));
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        Optional<UserAccount> found = userRepository.findByEmail(email);

        String hashToCheck = found.map(UserAccount::getPasswordHash).orElse(dummyHash);
        boolean passwordMatches = passwordEncoder.matches(request.password(), hashToCheck);

        // One message for both "no such email" and "wrong password", so the response
        // doesn't reveal which emails have accounts.
        if (found.isEmpty() || !passwordMatches) {
            throw new InvalidCredentialsException("Wrong email or password.");
        }
        return userMapper.toResponse(found.get());
    }

    // "Ali@Example.com" and "ali@example.com" must be the same account.
    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}