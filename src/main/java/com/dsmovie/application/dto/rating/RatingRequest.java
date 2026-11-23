package com.dsmovie.application.dto.rating;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

@Schema(name = "RatingRequest", description = "Nota associada ao usuário autenticado e ao filme informado")
public record RatingRequest(
        @Schema(description = "Identificador do filme", example = "1")
        @NotNull(message = "Movie id is required")
        Long movieId,

        @Schema(description = "Nota decimal entre 1 e 5", example = "4.5", minimum = "1", maximum = "5")
        @NotNull(message = "Rating value is required")
        @DecimalMin(value = "1.0", message = "Rating must be between 1 and 5")
        @DecimalMax(value = "5.0", message = "Rating must be between 1 and 5")
        Double value
) {}