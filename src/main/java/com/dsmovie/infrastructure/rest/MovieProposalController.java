package com.dsmovie.infrastructure.rest;

import com.dsmovie.application.dto.movie.MovieProposalRequest;
import com.dsmovie.application.port.in.SendMovieProposalUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movie-requests")
@Tag(name = "Propostas de filmes", description = "Solicitação de inclusão de filmes pelos usuários")
public class MovieProposalController {

    private final SendMovieProposalUseCase useCase;

    public MovieProposalController(SendMovieProposalUseCase useCase) {
        this.useCase = useCase;
    }

    @PostMapping
    @Operation(summary = "Enviar proposta", description = "Envia uma sugestão de filme por e-mail aos administradores")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> send(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody MovieProposalRequest request) {
        useCase.send(userId, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }
}

