package com.dsmovie.application.dto.movie;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "MovieResponse", description = "Dados públicos de um filme")
public record MovieResponse(
        @Schema(description = "Identificador do filme", example = "1") Long id,
        @Schema(description = "Título do filme", example = "Os Vingadores") String title,
        @Schema(description = "Sinopse do filme", nullable = true) String synopsis,
        @Schema(description = "URL da imagem", example = "https://example.com/movie.jpg") String image,
        @Schema(description = "Média das avaliações entre 0 e 5", example = "4.25") double score,
        @Schema(description = "Quantidade de avaliações", example = "8") int count
) {}