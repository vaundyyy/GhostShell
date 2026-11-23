package com.dsmovie.application.port.out;

import com.dsmovie.domain.model.Rating;
import java.util.List;
import java.util.Optional;

public interface RatingRepositoryPort {
    record Aggregate(double average, long count) {}

    Optional<Rating> findByUserAndMovie(Long userId, Long movieId);
    Rating save(Rating rating);
    List<Double> findValuesByMovieId(Long movieId);
    Aggregate aggregateByMovieId(Long movieId);
}