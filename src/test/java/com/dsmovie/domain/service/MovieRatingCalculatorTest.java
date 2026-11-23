package com.dsmovie.domain.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MovieRatingCalculatorTest {
    private final MovieRatingCalculator calculator = new MovieRatingCalculator();

    @Test
    void shouldCalculateAverage() {
        assertEquals(4.0, calculator.average(List.of(4.0, 5.0, 3.0)), 0.001);
    }

    @Test
    void shouldReturnZeroForEmptyValues() {
        assertEquals(0.0, calculator.average(List.of()), 0.001);
        assertEquals(0.0, calculator.average(null), 0.001);
    }
}

