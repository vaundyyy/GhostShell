package com.dsmovie.application.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "AuthResponse", description = "Dados públicos do usuário e token JWT")
public record AuthResponse(
        @Schema(description = "Identificador persistido do usuário", example = "1") Long id,
        @Schema(description = "Nome do usuário", example = "João Silva") String name,
        @Schema(description = "Email do usuário", example = "joao@email.com") String email,
        @Schema(description = "Role efetiva do usuário", example = "USER") String role,
        @Schema(description = "Token JWT para requisições autenticadas") String token
) {}