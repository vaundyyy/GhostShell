package com.dsmovie.infrastructure.persistence.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_movie")
public class MovieEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 255)
    private String image;

    @Column(nullable = false)
    private double score;

    @Column(nullable = false)
    private int count;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }
    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }
}
