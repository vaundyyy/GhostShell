package com.dsmovie.domain.model;

import com.dsmovie.domain.exception.DadosInvalidosException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MovieTest {
    @Test
    void shouldRejectInvalidImageUrl() {
        Movie movie = new Movie(null, "Filme", null, "ftp://example.com/a.jpg", 0.0, 0);
        assertThrows(DadosInvalidosException.class, movie::validate);
    }

    @Test
    void shouldUpdateRatingTotals() {
        Movie movie = new Movie(1L, "Filme", null, null, 0.0, 0);
        movie.updateRating(4.25, 4);
        assertEquals(4.25, movie.getScore());
        assertEquals(4, movie.getCount());
    }

    @Test
    void shouldRejectNegativeTotals() {
        Movie movie = new Movie();
        assertThrows(DadosInvalidosException.class, () -> movie.updateRating(-1.0, 0));
    }
}

