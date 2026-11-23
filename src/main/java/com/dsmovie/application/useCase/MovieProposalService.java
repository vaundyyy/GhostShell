package com.dsmovie.application.useCase;

import com.dsmovie.application.dto.movie.MovieProposalRequest;
import com.dsmovie.application.port.in.SendMovieProposalUseCase;
import com.dsmovie.application.port.out.SendMovieProposalPort;
import com.dsmovie.application.port.out.UserRepositoryPort;
import com.dsmovie.domain.exception.UserNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class MovieProposalService implements SendMovieProposalUseCase {

    private final UserRepositoryPort userRepository;
    private final SendMovieProposalPort proposalPort;

    public MovieProposalService(UserRepositoryPort userRepository, SendMovieProposalPort proposalPort) {
        this.userRepository = userRepository;
        this.proposalPort = proposalPort;
    }

    @Override
    public void send(Long authenticatedUserId, MovieProposalRequest request) {
        if (authenticatedUserId == null) {
            throw new UserNotFoundException("Authenticated user is required");
        }

        userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new UserNotFoundException("Authenticated user not found"));

        proposalPort.send(authenticatedUserId, request.title().trim(),
                request.message() == null ? null : request.message().trim());
    }
}

