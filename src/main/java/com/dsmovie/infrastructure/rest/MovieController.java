package com.dsmovie.infrastructure.rest;

import com.dsmovie.application.dto.movie.MovieListResponse;
import com.dsmovie.application.dto.movie.MovieResponse;
import com.dsmovie.application.port.in.GetMovieUseCase;
import com.dsmovie.infrastructure.exception.GlobalExceptionHandler.ApiError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movies")
@Validated
@Tag(name = "Filmes", description = "Consulta de filmes e estatísticas de avaliação")
public class MovieController {
    private final GetMovieUseCase useCase;

    public MovieController(GetMovieUseCase useCase) {
        this.useCase = useCase;
    }

    @GetMapping
    @Operation(summary = "Listar filmes", description = "Retorna os filmes em uma paginação, ordenados pelo repositório")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Página de filmes retornada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Parâmetros de paginação inválidos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<MovieListResponse> findAll(
            @Parameter(description = "Número da página, iniciando em zero", example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Quantidade de itens por página", example = "12")
            @RequestParam(defaultValue = "12") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(useCase.findAll(page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar filme por ID", description = "Retorna um filme e a média atual das avaliações")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Filme encontrado"),
        @ApiResponse(responseCode = "404", description = "Filme não encontrado",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<MovieResponse> findById(
            @Parameter(description = "Identificador do filme", example = "1")
            @PathVariable Long id) {
        return ResponseEntity.ok(useCase.findById(id));
    }
}
