package com.dsmovie.infrastructure.rest;

import com.dsmovie.application.dto.movie.CreateMovieRequest;
import com.dsmovie.application.dto.movie.MovieResponse;
import com.dsmovie.application.port.in.CreateMovieUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/movies")
@Tag(name = "Administração", description = "Operações exclusivas de administradores")
public class AdminMovieController {

    private final CreateMovieUseCase useCase;

    public AdminMovieController(CreateMovieUseCase useCase) {
        this.useCase = useCase;
    }

    @PostMapping
    @Operation(summary = "Adicionar filme", description = "Adiciona um novo filme ao catálogo público")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<MovieResponse> create(@Valid @RequestBody CreateMovieRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(useCase.create(request));
    }
}

