package com.dsmovie.infrastructure.exception;

import com.dsmovie.domain.exception.AuthenticationException;
import com.dsmovie.domain.exception.DadosInvalidosException;
import com.dsmovie.domain.exception.InvalidRatingException;
import com.dsmovie.domain.exception.MovieNotFoundException;
import com.dsmovie.domain.exception.UserNotFoundException;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.UUID;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @Schema(name = "ApiError", description = "Formato padrão de resposta de erro")
    public record ApiError(
            @Schema(description = "Identificador da requisição") String traceId,
            @Schema(description = "Momento em que o erro ocorreu") Instant timestamp,
            @Schema(description = "Código HTTP", example = "404") int status,
            @Schema(description = "Nome do status HTTP", example = "Not Found") String error,
            @Schema(description = "Descrição legível do erro", example = "Movie not found") String message,
            @Schema(description = "Caminho da requisição", example = "/api/movies/99") String path
    ) {}

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    @ExceptionHandler({MovieNotFoundException.class, UserNotFoundException.class})
    public ResponseEntity<ApiError> handleNotFound(RuntimeException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidRatingException.class)
    public ResponseEntity<ApiError> handleUnprocessable(InvalidRatingException ex, HttpServletRequest request) {
        return build(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), request);
    }

    @ExceptionHandler({DadosInvalidosException.class, IllegalArgumentException.class})
    public ResponseEntity<ApiError> handleConflict(RuntimeException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + "=" + error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraint(ConstraintViolationException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDatabaseIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "Operation conflicts with database constraints", request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "Access denied", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected internal error", request);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message, HttpServletRequest request) {
        String incomingTraceId = request.getHeader("X-Request-Id");
        String traceId = incomingTraceId == null || incomingTraceId.isBlank()
                ? UUID.randomUUID().toString()
                : incomingTraceId.trim();
        ApiError body = new ApiError(traceId, Instant.now(), status.value(), status.getReasonPhrase(), message, request.getRequestURI());

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Request-Id", traceId);
        return ResponseEntity.status(status).headers(headers).body(body);
    }
}
