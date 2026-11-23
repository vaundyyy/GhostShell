package com.dsmovie.domain.model;

import com.dsmovie.domain.exception.DadosInvalidosException;
import java.util.LinkedHashSet;
import java.util.Set;

public class User {

    public enum Role { USER, ADMIN }

    private Long id;
    private String name;
    private String email;
    private String password;
    private Set<Role> roles = new LinkedHashSet<>(Set.of(Role.USER));

    public User() {}

    public User(Long id, String name, String email, String password) {
        this(id, name, email, password, Role.USER);
    }

    public User(Long id, String name, String email, String password, Role role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.roles = new LinkedHashSet<>();
        this.roles.add(role == null ? Role.USER : role);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() {
        return roles.contains(Role.ADMIN) ? Role.ADMIN : Role.USER;
    }
    public void setRole(Role role) {
        this.roles = new LinkedHashSet<>();
        this.roles.add(role == null ? Role.USER : role);
    }
    public Set<Role> getRoles() { return Set.copyOf(roles); }
    public void setRoles(Set<Role> roles) {
        if (roles == null || roles.size() != 1) {
            throw new DadosInvalidosException("User must have exactly one role");
        }
        this.roles = new LinkedHashSet<>(roles);
    }

    public void validacaoUser() {
        if (name == null || name.isBlank()) {
            throw new DadosInvalidosException("Name is required");
        }
        if (email == null || email.isBlank() || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") ) {
            throw new DadosInvalidosException("Valid email is required");
        }
        if (password == null || password.isBlank()) {
            throw new DadosInvalidosException("Password is required");
        }
    }
}