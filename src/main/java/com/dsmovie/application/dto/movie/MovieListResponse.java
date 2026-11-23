package com.dsmovie.application.dto.movie;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(name = "MovieListResponse", description = "Página paginada de filmes")
public record MovieListResponse(
        @Schema(description = "Filmes da página atual") List<MovieResponse> content,
        @Schema(description = "Índice da página, iniciando em zero", example = "0") int page,
        @Schema(description = "Quantidade solicitada por página", example = "12") int size,
        @Schema(description = "Total de filmes disponíveis", example = "36") long totalElements,
        @Schema(description = "Total de páginas", example = "3") int totalPages
) {}