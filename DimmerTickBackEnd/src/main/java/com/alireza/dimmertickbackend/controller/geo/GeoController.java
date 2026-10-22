package com.alireza.dimmertickbackend.controller.geo;

import com.alireza.dimmertickbackend.service.geo.GeoService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/geo")
@RequiredArgsConstructor
public class GeoController {

    private final GeoService geo;

    @GetMapping("/me")
    public GeoService.ClientInfo me(HttpServletRequest request) {
        return geo.describe(request);
    }
}