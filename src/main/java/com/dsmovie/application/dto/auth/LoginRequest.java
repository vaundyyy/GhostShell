package com.dsmovie.application.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "LoginRequest", description = "Dados necessários para autenticar um usuário")
public record LoginRequest(
        @Schema(description = "Email cadastrado", example = "joao@email.com")
        @NotBlank(message = "Email is required")
        @Email(message = "Email is invalid")
        String email,

        @Schema(description = "Senha do usuário", example = "senha123", format = "password")
        @NotBlank(message = "Password is required")
        String password
) {}
