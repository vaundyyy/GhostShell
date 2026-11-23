package com.dsmovie.infrastructure.rest;

import com.dsmovie.application.dto.auth.AuthResponse;
import com.dsmovie.application.dto.auth.LoginRequest;
import com.dsmovie.application.dto.auth.RegisterRequest;
import com.dsmovie.application.port.in.AuthUseCase;
import com.dsmovie.infrastructure.exception.GlobalExceptionHandler.ApiError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação", description = "Cadastro e login de usuários")
public class AuthController {

    private final AuthUseCase authUseCase;

    public AuthController(AuthUseCase authUseCase) {
        this.authUseCase = authUseCase;
    }

    @PostMapping("/login")
    @Operation(summary = "Autenticar usuário", description = "Valida email e senha e retorna um token JWT de acesso")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados de login inválidos",
            content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "401", description = "Credenciais inválidas",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authUseCase.login(request));
    }

    @PostMapping("/register")
    @Operation(summary = "Cadastrar usuário", description = "Cria um usuário com senha protegida por BCrypt e retorna um token JWT")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Usuário cadastrado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados de cadastro inválidos",
            content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "409", description = "Email já está em uso",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authUseCase.register(request));
    }
}