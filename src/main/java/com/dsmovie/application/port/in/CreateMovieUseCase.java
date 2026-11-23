package com.dsmovie.application.port.in;

import com.dsmovie.application.dto.movie.CreateMovieRequest;
import com.dsmovie.application.dto.movie.MovieResponse;

public interface CreateMovieUseCase {
    MovieResponse create(CreateMovieRequest request);
}

