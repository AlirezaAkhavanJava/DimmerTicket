package com.alireza.dimmertickbackend.service;

import com.alireza.dimmertickbackend.domain.AppUser;
import com.alireza.dimmertickbackend.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

    private final AppUserRepository userRepository;

    // Spring calls this during login. Our login uses the email as the username.
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) {
        AppUser user = userRepository.findByEmailIgnoreCase(email.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new UsernameNotFoundException("Wrong email or password"));

        // roles("ADMIN") becomes the authority "ROLE_ADMIN", which hasRole("ADMIN") checks.
        return User.withUsername(user.getEmail())
                .password(user.getPassword())   // already a BCrypt hash
                .roles(user.getRole().name())
                .build();
    }
}