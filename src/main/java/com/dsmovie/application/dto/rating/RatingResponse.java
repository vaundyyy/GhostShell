package com.dsmovie.application.dto.rating;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "RatingResponse", description = "Resultado da avaliação e estatísticas atualizadas do filme")
public record RatingResponse(
        @Schema(description = "Identificador do filme", example = "1") Long movieId,
        @Schema(description = "Identificador do usuário que realizou a avaliação", example = "1") Long userId,
        @Schema(description = "Nota salva pelo usuário", example = "4.5") double value,
        @Schema(description = "Nova média das avaliações do filme", example = "4.25") double movieScore,
        @Schema(description = "Novo número de avaliações do filme", example = "8") int movieCount
) {}