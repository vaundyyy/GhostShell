package com.dsmovie.infrastructure.persistence.adapter;

import com.dsmovie.application.port.out.SendMovieProposalPort;
import com.dsmovie.domain.exception.DadosInvalidosException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class SmtpMovieProposalAdapter implements SendMovieProposalPort {

    private final JavaMailSender mailSender;

    @Value("${app.admin-email:}")
    private String adminEmail;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    public SmtpMovieProposalAdapter(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    @Async
    public void send(Long userId, String title, String message) {
        if (adminEmail == null || adminEmail.isBlank()) {
            throw new DadosInvalidosException("Admin email is not configured");
        }

        SimpleMailMessage email = new SimpleMailMessage();
        email.setTo(adminEmail.trim());
        if (senderEmail != null && !senderEmail.isBlank()) {
            email.setFrom(senderEmail.trim());
        }
        email.setSubject("[GitCine] Proposta de novo filme: " + title);
        email.setText("Usuário ID: " + userId
                + "\nTítulo sugerido: " + title
                + "\n\nMensagem:\n" + (message == null || message.isBlank() ? "Sem observações." : message));
        mailSender.send(email);
    }
}