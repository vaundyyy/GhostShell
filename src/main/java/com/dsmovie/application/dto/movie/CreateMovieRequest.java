package com.dsmovie.application.dto.movie;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "CreateMovieRequest", description = "Dados necessários para adicionar um filme ao catálogo")
public record CreateMovieRequest(
        @Schema(description = "Título do filme", example = "Filme novo")
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must have at most 255 characters")
        String title,

        @Schema(description = "URL da imagem do filme", example = "https://example.com/filme.jpg")
        @Size(max = 255, message = "Image must have at most 255 characters")
        String image
) {}

