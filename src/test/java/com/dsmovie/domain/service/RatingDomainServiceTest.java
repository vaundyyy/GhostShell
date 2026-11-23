package com.dsmovie.domain.service;

import com.dsmovie.domain.exception.InvalidRatingException;
import com.dsmovie.domain.model.Rating;
import com.dsmovie.domain.model.RatingId;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RatingDomainServiceTest {

    private final RatingDomainService service = new RatingDomainService();

    @Test
    void shouldCreateRating() {
        Rating rating = service.createOrUpdate(null, 10L, 20L, 4.5);

        assertEquals(new RatingId(10L, 20L), rating.getId());
        assertEquals(4.5, rating.getValue());
    }

    @Test
    void shouldUpdateExistingRating() {
        Rating existing = new Rating(new RatingId(10L, 20L), 2.0);

        Rating rating = service.createOrUpdate(existing, 10L, 20L, 5.0);

        assertEquals(existing, rating);
        assertEquals(5.0, rating.getValue());
    }

    @Test
    void shouldRejectInvalidRating() {
        assertThrows(InvalidRatingException.class,
                () -> service.createOrUpdate(null, 10L, 20L, 6.0));
    }
}

