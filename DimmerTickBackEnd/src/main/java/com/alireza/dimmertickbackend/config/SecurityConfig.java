package com.alireza.dimmertickbackend.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   SecurityContextRepository securityContextRepository) throws Exception {

        // Angular-style CSRF: the token lives in a cookie the JavaScript can read,
        // and the page sends it back in the X-XSRF-TOKEN header.
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
        csrfHandler.setCsrfRequestAttributeName(null);

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(csrfHandler))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .securityContext(sc -> sc.securityContextRepository(securityContextRepository))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(jsonUnauthorized())
                        .accessDeniedHandler((req, res, ex) -> {
                            res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            res.setContentType("application/json");
                            res.getWriter().write("{\"message\":\"You do not have permission to do this.\"}");
                        }))

                //Authorization
                .authorizeHttpRequests(auth -> auth
                        // Public pages: browsing is open to everyone, with or without an account.
                        .requestMatchers(HttpMethod.GET,
                                "/", "/index.html",
                                "/movies", "/movies.html",
                                "/login", "/login.html",
                                "/register", "/register.html",
                                "/admin", "/admin.html",
                                "/css/**", "/js/**", "/favicon.svg", "/favicon.ico").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Public API reads: movies, details, trailers, showtimes
                        .requestMatchers(HttpMethod.GET, "/api/movies/**").permitAll()

                        // Auth endpoints
                        .requestMatchers("/api/auth/csrf", "/api/auth/login", "/api/auth/register").permitAll()
                        .requestMatchers("/actuator/health").permitAll()

                        // Admin only
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/users/**").hasRole("ADMIN")

                        // Login required: watchlist and booking, and anything else not listed above
                        .requestMatchers("/api/watchlist/**", "/api/bookings/**", "/api/tickets/**").authenticated()
                        .anyRequest().authenticated());

        return http.build();
    }

    /**
     * Session storage for the login state. AuthController saves into this after a successful login.
     */
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    /**
     * Used by AuthController to check email and password.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Return JSON 401 instead of a login-page redirect, since this is an API.
     */
    private AuthenticationEntryPoint jsonUnauthorized() {
        return (request, response, ex) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Please log in.\"}");
        };
    }
}