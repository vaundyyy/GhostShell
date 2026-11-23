package com.dsmovie.domain.model;

import com.dsmovie.domain.exception.DadosInvalidosException;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class UserTest {
    @Test
    void shouldAcceptExactlyOneRole() {
        User user = new User(1L, "Maria", "maria@email.com", "encoded", User.Role.ADMIN);
        assertEquals(User.Role.ADMIN, user.getRole());
        assertEquals(Set.of(User.Role.ADMIN), user.getRoles());
    }

    @Test
    void shouldRejectMultipleRoles() {
        User user = new User();
        assertThrows(DadosInvalidosException.class,
                () -> user.setRoles(Set.of(User.Role.USER, User.Role.ADMIN)));
    }

    @Test
    void shouldValidateRequiredData() {
        User user = new User();
        assertThrows(DadosInvalidosException.class, user::validacaoUser);
    }
}

