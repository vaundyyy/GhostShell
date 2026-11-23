package com.dsmovie.application.port.in;

import com.dsmovie.application.dto.movie.MovieProposalRequest;

public interface SendMovieProposalUseCase {
    void send(Long authenticatedUserId, MovieProposalRequest request);
}
