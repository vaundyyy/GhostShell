package com.dsmovie.infrastructure.persistence.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_score")
public class RatingEntity {
    @EmbeddedId
    private RatingIdEntity id;

    @Column(name = "rating", nullable = false)
    private double value;

    public RatingIdEntity getId() { return id; }
    public void setId(RatingIdEntity id) { this.id = id; }
    public double getValue() { return value; }
    public void setValue(double value) { this.value = value; }
}
