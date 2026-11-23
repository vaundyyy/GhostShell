package com.dsmovie.application.useCase;

import com.dsmovie.application.dto.movie.CreateMovieRequest;
import com.dsmovie.application.dto.movie.MovieListResponse;
import com.dsmovie.application.dto.movie.MovieResponse;
import com.dsmovie.application.port.out.MovieRepositoryPort;
import com.dsmovie.domain.exception.DadosInvalidosException;
import com.dsmovie.domain.exception.MovieNotFoundException;
import com.dsmovie.domain.model.Movie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MovieServiceTest {
    private MovieRepositoryPort repository;
    private MovieService service;

    @BeforeEach
    void setUp() {
        repository = mock(MovieRepositoryPort.class);
        service = new MovieService(repository);
    }

    @Test
    void shouldListMoviesWithPaginationMetadata() {
        when(repository.findAll(0, 12)).thenReturn(List.of(new Movie(1L, "Filme", null, "https://example.com/a.jpg", 4.0, 2)));
        when(repository.count()).thenReturn(13L);

        MovieListResponse response = service.findAll(0, 12);

        assertEquals(1, response.content().size());
        assertEquals(13L, response.totalElements());
        assertEquals(2, response.totalPages());
    }

    @Test
    void shouldRejectInvalidPagination() {
        assertThrows(DadosInvalidosException.class, () -> service.findAll(-1, 12));
        assertThrows(DadosInvalidosException.class, () -> service.findAll(0, 101));
    }

    @Test
    void shouldFindMovieById() {
        when(repository.findById(1L)).thenReturn(Optional.of(new Movie(1L, "Filme", null, null, 3.5, 2)));

        MovieResponse response = service.findById(1L);

        assertEquals("Filme", response.title());
        assertEquals(3.5, response.score());
    }

    @Test
    void shouldRejectUnknownMovie() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(MovieNotFoundException.class, () -> service.findById(99L));
    }

    @Test
    void shouldCreateMovieForAdmin() {
        when(repository.existsByNormalizedTitle("Filme Novo")).thenReturn(false);
        when(repository.save(any(Movie.class))).thenAnswer(invocation -> {
            Movie movie = invocation.getArgument(0);
            movie.setId(10L);
            return movie;
        });

        MovieResponse response = service.create(new CreateMovieRequest("  Filme   Novo ", "https://example.com/filme.jpg"));

        assertEquals(10L, response.id());
        assertEquals("Filme Novo", response.title());
        assertEquals(0.0, response.score());
        assertEquals(0, response.count());
    }

    @Test
    void shouldRejectDuplicateMovieTitle() {
        when(repository.existsByNormalizedTitle("Filme Novo")).thenReturn(true);
        assertThrows(DadosInvalidosException.class,
                () -> service.create(new CreateMovieRequest("Filme Novo", null)));
    }
}

