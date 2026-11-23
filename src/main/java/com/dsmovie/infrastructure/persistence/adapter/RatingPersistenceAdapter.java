package com.dsmovie.infrastructure.persistence.adapter;

import com.dsmovie.application.port.out.RatingRepositoryPort;
import com.dsmovie.domain.model.Rating;
import com.dsmovie.domain.model.RatingId;
import com.dsmovie.infrastructure.persistence.entity.RatingEntity;
import com.dsmovie.infrastructure.persistence.entity.RatingIdEntity;
import com.dsmovie.infrastructure.persistence.repository.RatingJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class RatingPersistenceAdapter implements RatingRepositoryPort {
    private final RatingJpaRepository repository;

    public RatingPersistenceAdapter(RatingJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Rating> findByUserAndMovie(Long userId, Long movieId) {
        return repository.findById(new RatingIdEntity(movieId, userId)).map(this::toDomain);
    }

    @Override
    public Rating save(Rating rating) {
        RatingEntity entity = new RatingEntity();
        entity.setId(new RatingIdEntity(rating.getId().getMovieId(), rating.getId().getUserId()));
        entity.setValue(rating.getValue());
        return toDomain(repository.save(entity));
    }

    @Override
    public List<Double> findValuesByMovieId(Long movieId) {
        return repository.findValuesByMovieId(movieId);
    }

    @Override
    public Aggregate aggregateByMovieId(Long movieId) {
        Object[] aggregate = repository.aggregateByMovieId(movieId);
        if (aggregate == null || aggregate.length < 2) {
            return new Aggregate(0.0, 0);
        }

        double average = aggregate[0] == null
            ? 0.0
            : Double.parseDouble(aggregate[0].toString());
        long count = aggregate[1] == null
            ? 0
            : Long.parseLong(aggregate[1].toString());
        return new Aggregate(average, count);
    }

    private Rating toDomain(RatingEntity entity) {
        RatingId id = new RatingId(entity.getId().getMovieId(), entity.getId().getUserId());
        return new Rating(id, entity.getValue());
    }
}