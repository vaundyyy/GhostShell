package com.dsmovie.infrastructure.security;

import com.dsmovie.domain.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class JwtServiceTest {
    private JwtService service;

    @BeforeEach
    void setUp() {
        Environment environment = mock(Environment.class);
        service = new JwtService(environment);
        ReflectionTestUtils.setField(service, "secret", "um-secret-seguro-com-mais-de-32-caracteres-para-testes");
        ReflectionTestUtils.setField(service, "expiration", 7200000L);
        ReflectionTestUtils.setField(service, "issuer", "gitcine-backend");
        service.init();
    }

    @Test
    void shouldGenerateTokenWithUserIdAndRole() {
        User user = new User(15L, "Maria", "maria@gmail.com", "hash", User.Role.ADMIN);

        String token = service.generateToken(user);

        assertEquals(15L, service.extractUserId(token));
        assertEquals("maria@gmail.com", service.extractEmail(token));
        assertEquals("ADMIN", service.extractRole(token));
        assertTrue(service.isTokenValid(token));
    }

    @Test
    void shouldRejectInvalidToken() {
        assertFalse(service.isTokenValid("token.invalido"));
    }

    @Test
    void shouldRejectTokenWithoutPersistedUser() {
        assertThrows(IllegalArgumentException.class,
                () -> service.generateToken(new User(null, "Ana", "ana@gmail.com", "hash")));
    }
}

