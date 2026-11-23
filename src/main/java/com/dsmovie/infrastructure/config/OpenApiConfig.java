package com.dsmovie.infrastructure.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "GitCine API",
        version = "1.0",
        description = "API de autenticação, consulta de filmes e avaliações",
        contact = @Contact(name = "GitCine")
    ),
    servers = {
        @Server(url = "http://localhost:8080", description = "Ambiente local")
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "Informe o token JWT no formato: Bearer <token>"
)
public class OpenApiConfig {
}
