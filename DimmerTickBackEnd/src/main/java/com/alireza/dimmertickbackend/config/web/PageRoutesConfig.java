package com.alireza.dimmertickbackend.config.web;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Clean URLs such as /movies serve the matching HTML file, without the .html extension.
@Configuration
public class PageRoutesConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/movies").setViewName("forward:/movies.html");
        registry.addViewController("/login").setViewName("forward:/login.html");
        registry.addViewController("/register").setViewName("forward:/register.html");
        registry.addViewController("/admin").setViewName("forward:/admin.html");
    }
}