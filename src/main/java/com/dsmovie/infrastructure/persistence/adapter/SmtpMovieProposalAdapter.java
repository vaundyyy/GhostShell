package com.dsmovie.infrastructure.persistence.adapter;

import com.dsmovie.application.port.out.SendMovieProposalPort;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class SmtpMovieProposalAdapter implements SendMovieProposalPort {

    private final JavaMailSender mailSender;
    private final String adminEmail;
    private final String senderEmail;

    public SmtpMovieProposalAdapter(
            JavaMailSender mailSender,
            @Value("${app.admin-email:}") String adminEmail,
            @Value("${spring.mail.username:}") String senderEmail) {
        this.mailSender = mailSender;
        this.adminEmail = adminEmail;
        this.senderEmail = senderEmail;
    }

    @PostConstruct
    void validateConfiguration() {
        if (adminEmail == null || adminEmail.isBlank()) {
            throw new IllegalStateException("Propriedade obrigatória 'app.admin-email' (ADMIN_EMAIL) não configurada.");
        }
    }

    @Override
    @Async
    public void send(Long userId, String title, String message) {
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