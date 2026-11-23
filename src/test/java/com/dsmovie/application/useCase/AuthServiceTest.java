package com.dsmovie.application.useCase;

import com.dsmovie.application.dto.auth.AuthResponse;
import com.dsmovie.application.dto.auth.LoginRequest;
import com.dsmovie.application.dto.auth.RegisterRequest;
import com.dsmovie.application.port.out.AuthenticationTokenPort;
import com.dsmovie.application.port.out.UserRepositoryPort;
import com.dsmovie.domain.exception.AuthenticationException;
import com.dsmovie.domain.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private UserRepositoryPort userRepository;
    private PasswordEncoder passwordEncoder;
    private AuthenticationTokenPort tokenPort;
    private AuthService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepositoryPort.class);
        passwordEncoder = mock(PasswordEncoder.class);
        tokenPort = mock(AuthenticationTokenPort.class);
        service = new AuthService(userRepository, passwordEncoder, tokenPort);
    }

    @Test
    void shouldLoginWithValidCredentials() {
        User user = new User(1L, "Joao", "joao@email.com", "encoded-password");
        when(userRepository.findByEmail("joao@email.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("senha123", "encoded-password")).thenReturn(true);
        when(tokenPort.generateToken(user)).thenReturn("jwt-token");

        AuthResponse response = service.login(new LoginRequest(" JOAO@EMAIL.COM ", "senha123"));

        assertEquals(1L, response.id());
        assertEquals("jwt-token", response.token());
    }

    @Test
    void shouldRejectInvalidPassword() {
        User user = new User(1L, "Joao", "joao@email.com", "encoded-password");
        when(userRepository.findByEmail("joao@email.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded-password")).thenReturn(false);

        assertThrows(AuthenticationException.class,
                () -> service.login(new LoginRequest("joao@email.com", "wrong")));
    }

    @Test
    void shouldRegisterNormalizedUser() {
        RegisterRequest request = new RegisterRequest("  Joao  ", " JOAO@EMAIL.COM ", "senha123");
        when(userRepository.findByEmail("joao@email.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("senha123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });
        when(tokenPort.generateToken(any(User.class))).thenReturn("jwt-token");

        AuthResponse response = service.register(request);

        assertEquals(1L, response.id());
        assertEquals("Joao", response.name());
        assertEquals("joao@email.com", response.email());
        assertEquals("jwt-token", response.token());
    }
}

