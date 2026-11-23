package com.dsmovie.application.dto.movie;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "MovieProposalRequest", description = "Solicitação para inclusão de um filme no catálogo")
public record MovieProposalRequest(
        @Schema(description = "Título sugerido", example = "Oppenheimer")
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must have at most 255 characters")
        String title,

        @Schema(description = "Motivo da sugestão", example = "Ainda não está disponível no catálogo")
        @Size(max = 1000, message = "Message must have at most 1000 characters")
        String message
) {}

