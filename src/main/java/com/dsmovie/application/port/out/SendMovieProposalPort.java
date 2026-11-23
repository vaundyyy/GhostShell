package com.dsmovie.application.port.out;

public interface SendMovieProposalPort {
    void send(Long userId, String title, String message);
}

