package com.alireza.dimmertickbackend.service.geo;

import com.alireza.dimmertickbackend.config.geo.GeoProperties;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class GeoService {

    /** The IP and country of one request, and whether we refuse service to it. */
    public record ClientInfo(String ip, String country, boolean blocked) {
    }

    private final GeoProperties props;

    public ClientInfo describe(HttpServletRequest request) {
        // Behind a reverse proxy, set server.forward-headers-strategy=framework so this is the real client IP.
        String ip = request.getRemoteAddr();
        String country = countryOf(ip);
        return new ClientInfo(ip, country, props.blocked().contains(country));
    }

    private String countryOf(String ip) {
        String override = props.devCountry() == null ? "" : props.devCountry().trim();
        if (!override.isEmpty()) {
            return override.toUpperCase(Locale.ROOT);
        }
        // Production: look up `ip` in a MaxMind GeoLite2-Country database.
        // Until then, unknown locations are allowed. Decide your launch policy before going live.
        return "UNKNOWN";
    }
}