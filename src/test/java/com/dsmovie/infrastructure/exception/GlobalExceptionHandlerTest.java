package com.dsmovie.infrastructure.exception;

import com.dsmovie.domain.exception.AuthenticationException;
import com.dsmovie.domain.exception.InvalidRatingException;
import com.dsmovie.domain.exception.MovieNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void shouldMapAuthenticationExceptionTo401() {
        HttpServletRequest request = request("/api/ratings");
        ResponseEntity<GlobalExceptionHandler.ApiError> response =
                handler.handleAuthentication(new AuthenticationException("Invalid credentials"), request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals(401, response.getBody().status());
    }

    @Test
    void shouldMapNotFoundExceptionTo404() {
        HttpServletRequest request = request("/api/movies/99");
        ResponseEntity<GlobalExceptionHandler.ApiError> response =
                handler.handleNotFound(new MovieNotFoundException("Movie not found"), request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Movie not found", response.getBody().message());
    }

    @Test
    void shouldMapInvalidRatingTo422() {
        HttpServletRequest request = request("/api/ratings");
        ResponseEntity<GlobalExceptionHandler.ApiError> response =
                handler.handleUnprocessable(new InvalidRatingException("Invalid rating"), request);

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, response.getStatusCode());
    }

    private HttpServletRequest request(String path) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn(path);
        when(request.getHeader("X-Request-Id")).thenReturn("test-trace-id");
        return request;
    }
}

