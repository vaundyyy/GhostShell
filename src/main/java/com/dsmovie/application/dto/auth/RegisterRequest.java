package com.dsmovie.application.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "RegisterRequest", description = "Dados necessários para cadastrar um usuário")
public record RegisterRequest(
        @Schema(description = "Nome de exibição", example = "João Silva")
        @NotBlank(message = "Name is required")
        String name,

        @Schema(description = "Email único do usuário", example = "joao@email.com")
        @NotBlank(message = "Email is required")
        @Email(message = "Email is invalid")
        String email,

        @Schema(description = "Senha entre 8 e 24 caracteres", example = "senha123", minLength = 8, maxLength = 24, format = "password")
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 24, message = "Password must have between 8 and 24 characters")
        String password
) {}