package com.alireza.dimmertickbackend.config.geo;

import com.alireza.dimmertickbackend.service.geo.GeoService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** Runs before Spring Security. Every API call from a blocked country gets HTTP 451. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class GeoBlockFilter extends OncePerRequestFilter {

    private final GeoService geo;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Static pages load everywhere. The geo endpoint must stay reachable so the page can show the message.
        return !path.startsWith("/api/") || path.startsWith("/api/geo/");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain chain)
            throws ServletException, IOException {
        if (!geo.describe(request).blocked()) {
            chain.doFilter(request, response);
            return;
        }
        response.setStatus(451);
        response.setContentType("application/json");
        response.getWriter().write("{\"status\":451,\"message\":\"DimmerTick is not available in your country.\"}");
    }
}