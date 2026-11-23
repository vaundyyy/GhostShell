package com.dsmovie.application.useCase;

import com.dsmovie.application.dto.rating.RatingRequest;
import com.dsmovie.application.dto.rating.RatingResponse;
import com.dsmovie.application.port.out.MovieRepositoryPort;
import com.dsmovie.application.port.out.RatingRepositoryPort;
import com.dsmovie.application.port.out.UserRepositoryPort;
import com.dsmovie.domain.exception.MovieNotFoundException;
import com.dsmovie.domain.exception.UserNotFoundException;
import com.dsmovie.domain.model.Movie;
import com.dsmovie.domain.model.Rating;
import com.dsmovie.domain.model.RatingId;
import com.dsmovie.domain.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RatingServiceTest {
    private MovieRepositoryPort movieRepository;
    private RatingRepositoryPort ratingRepository;
    private UserRepositoryPort userRepository;
    private RatingService service;

    @BeforeEach
    void setUp() {
        movieRepository = mock(MovieRepositoryPort.class);
        ratingRepository = mock(RatingRepositoryPort.class);
        userRepository = mock(UserRepositoryPort.class);
        service = new RatingService(movieRepository, ratingRepository, userRepository);
    }

    @Test
    void shouldCreateRatingAndRecalculateMovie() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(new User(7L, "Ana", "ana@email.com", "hash")));
        Movie movie = new Movie(1L, "Filme", null, null, 0.0, 0);
        when(movieRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(movie));
        when(ratingRepository.findByUserAndMovie(7L, 1L)).thenReturn(Optional.empty());
        when(ratingRepository.save(any(Rating.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(ratingRepository.aggregateByMovieId(1L)).thenReturn(new RatingRepositoryPort.Aggregate(4.5, 1));
        when(movieRepository.save(any(Movie.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RatingResponse response = service.save(7L, new RatingRequest(1L, 4.5));

        assertEquals(1L, response.movieId());
        assertEquals(7L, response.userId());
        assertEquals(4.5, response.movieScore());
        assertEquals(1, response.movieCount());
        verify(ratingRepository).save(argThat(r -> r.getId().equals(new RatingId(1L, 7L))));
    }

    @Test
    void shouldRejectMissingAuthenticatedUser() {
        assertThrows(UserNotFoundException.class,
                () -> service.save(null, new RatingRequest(1L, 4.0)));
    }

    @Test
    void shouldRejectUnknownUser() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(UserNotFoundException.class,
                () -> service.save(99L, new RatingRequest(1L, 4.0)));
    }

    @Test
    void shouldRejectUnknownMovie() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(new User(7L, "Ana", "ana@email.com", "hash")));
        when(movieRepository.findByIdForUpdate(99L)).thenReturn(Optional.empty());

        assertThrows(MovieNotFoundException.class,
                () -> service.save(7L, new RatingRequest(99L, 4.0)));
    }
}

