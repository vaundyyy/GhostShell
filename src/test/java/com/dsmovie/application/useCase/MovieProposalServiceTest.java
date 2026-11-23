package com.dsmovie.application.useCase;

import com.dsmovie.application.dto.movie.MovieProposalRequest;
import com.dsmovie.application.port.out.SendMovieProposalPort;
import com.dsmovie.application.port.out.UserRepositoryPort;
import com.dsmovie.domain.exception.UserNotFoundException;
import com.dsmovie.domain.model.User;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class MovieProposalServiceTest {

    @Test
    void shouldSendProposalForAuthenticatedUser() {
        UserRepositoryPort users = mock(UserRepositoryPort.class);
        SendMovieProposalPort proposalPort = mock(SendMovieProposalPort.class);
        MovieProposalService service = new MovieProposalService(users, proposalPort);
        when(users.findById(7L)).thenReturn(Optional.of(new User(7L, "Ana", "ana@email.com", "hash")));

        service.send(7L, new MovieProposalRequest("  Oppenheimer ", "  Sugestão  "));

        verify(proposalPort).send(7L, "Oppenheimer", "Sugestão");
    }

    @Test
    void shouldRejectProposalForUnknownUser() {
        UserRepositoryPort users = mock(UserRepositoryPort.class);
        SendMovieProposalPort proposalPort = mock(SendMovieProposalPort.class);
        MovieProposalService service = new MovieProposalService(users, proposalPort);
        when(users.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class,
                () -> service.send(99L, new MovieProposalRequest("Filme", "Mensagem")));
        verifyNoInteractions(proposalPort);
    }
}

