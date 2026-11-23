package com.dsmovie.infrastructure.rest;

import com.dsmovie.application.dto.rating.RatingRequest;
import com.dsmovie.application.dto.rating.RatingResponse;
import com.dsmovie.application.port.in.SaveRatingUseCase;
import com.dsmovie.infrastructure.exception.GlobalExceptionHandler.ApiError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ratings")
@Tag(name = "Avaliações", description = "Criação e atualização das avaliações dos usuários")
public class RatingController {
    private final SaveRatingUseCase useCase;

    public RatingController(SaveRatingUseCase useCase) {
        this.useCase = useCase;
    }

    @PostMapping
    @Operation(
        summary = "Salvar avaliação",
        description = "Cria ou atualiza a nota do usuário autenticado para o filme informado"
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Avaliação salva e score do filme recalculado"),
        @ApiResponse(responseCode = "400", description = "Dados da avaliação inválidos",
            content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "401", description = "Token ausente ou inválido",
            content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Usuário ou filme não encontrado",
            content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "422", description = "Nota fora do intervalo permitido",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<RatingResponse> save(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody RatingRequest request) {
        return ResponseEntity.ok(useCase.save(userId, request));
    }
}
