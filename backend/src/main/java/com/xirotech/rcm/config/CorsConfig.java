package com.xirotech.rcm.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${frontend.url:https://rcm-50.vercel.app}")
    private String configuredFrontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> allowedOrigins = new ArrayList<>();
        
        // Exact production deployed frontend URL
        allowedOrigins.add("https://rcm-50.vercel.app");
        allowedOrigins.add("https://rcm-50.vercel.app/");

        // Local development URLs
        allowedOrigins.add("http://localhost:5173");
        allowedOrigins.add("http://localhost:5174");
        allowedOrigins.add("http://localhost:3000");

        if (configuredFrontendUrl != null && !configuredFrontendUrl.isBlank() && !allowedOrigins.contains(configuredFrontendUrl)) {
            allowedOrigins.add(configuredFrontendUrl.trim());
            if (!configuredFrontendUrl.endsWith("/")) {
                allowedOrigins.add(configuredFrontendUrl.trim() + "/");
            }
        }

        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers")
                .exposedHeaders("Authorization")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
