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
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   SecurityContextRepository securityContextRepository) throws Exception {

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
                        .authenticationEntryPoint(loginRequired())
                        .accessDeniedHandler(accessDenied(securityContextRepository)))
                .authorizeHttpRequests(auth -> auth
                        // Public pages
                        .requestMatchers(HttpMethod.GET,
                                "/", "/index.html",
                                "/movies", "/movies.html",
                                "/login", "/login.html",
                                "/register", "/register.html",
                                "/admin", "/admin.html",
                                "/css/**", "/js/**", "/favicon.svg", "/favicon.ico").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Public API reads
                        .requestMatchers(HttpMethod.GET, "/api/movies/**").permitAll()

                        // Auth endpoints
                        .requestMatchers("/api/auth/csrf", "/api/auth/login", "/api/auth/register").permitAll()
                        .requestMatchers("/actuator/health").permitAll()

                        // Admin only
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/users/**").hasRole("ADMIN")

                        // Login required
                        .requestMatchers("/api/watchlist/**", "/api/bookings/**", "/api/tickets/**").authenticated()
                        .anyRequest().authenticated());

        return http.build();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /** Not signed in: say what they should do, based on what they tried to reach. */
    private AuthenticationEntryPoint loginRequired() {
        return (request, response, ex) -> writeError(response, HttpServletResponse.SC_UNAUTHORIZED,
                loginMessage(request.getRequestURI()));
    }

    /**
     * CSRF failures: an anonymous visitor is asked to log in; a signed-in user is asked to reload.
     * Anything else: signed in but not allowed, for example a normal user opening the admin area.
     */
    private AccessDeniedHandler accessDenied(SecurityContextRepository contexts) {
        return (request, response, ex) -> {
            String path = request.getRequestURI();
            if (ex instanceof CsrfException) {
                if (contexts.containsContext(request)) {
                    writeError(response, HttpServletResponse.SC_FORBIDDEN,
                            "Your security token expired. Reload the page and try again.");
                } else {
                    writeError(response, HttpServletResponse.SC_UNAUTHORIZED, loginMessage(path));
                }
            } else {
                writeError(response, HttpServletResponse.SC_FORBIDDEN, forbiddenMessage(path));
            }
        };
    }

    private String loginMessage(String path) {
        if (path.startsWith("/api/auth")) return "Reload the page and try again.";
        if (path.startsWith("/api/watchlist")) return "Log in to add movies to your watchlist.";
        if (path.startsWith("/api/bookings") || path.startsWith("/api/tickets")) return "Log in to book tickets.";
        if (path.startsWith("/api/admin")) return "Log in with an admin account to open the admin panel.";
        return "Log in to continue.";
    }

    private String forbiddenMessage(String path) {
        if (path.startsWith("/api/admin") || path.startsWith("/api/users")) {
            return "Only administrators can do this.";
        }
        return "You do not have permission to do this.";
    }

    // Messages are fixed strings written by us, never user input, so no escaping is needed.
    private void writeError(HttpServletResponse response, int status, String message) {
        try {
            response.setStatus(status);
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":" + status + ",\"message\":\"" + message + "\"}");
        } catch (Exception ignored) {
            // The response is already committed; nothing else can be sent.
        }
    }
}