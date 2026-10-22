package com.alireza.dimmertickbackend.config.geo;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.Set;

@ConfigurationProperties(prefix = "dimmertick.geo")
public record GeoProperties(
        @DefaultValue("FR,PS") Set<String> blocked,
        @DefaultValue("") String devCountry) {
}