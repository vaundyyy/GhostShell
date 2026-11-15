package com.dsmovie.application.useCase;

import com.dsmovie.application.dto.auth.AuthResponse;
import com.dsmovie.application.dto.auth.LoginRequest;
import com.dsmovie.application.dto.auth.RegisterRequest;
import com.dsmovie.application.port.in.AuthUseCase;
import com.dsmovie.application.port.out.UserRepositoryPort;
import com.dsmovie.domain.exception.AuthenticationException;
import com.dsmovie.domain.model.User;
import com.dsmovie.infrastructure.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService implements AuthUseCase {

    private final UserRepositoryPort userRepositoryPort;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepositoryPort userRepositoryPort,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepositoryPort = userRepositoryPort;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepositoryPort.findByEmail(request.email())
                .orElseThrow(() -> new AuthenticationException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new AuthenticationException("Invalid credentials");
        }

        String token = jwtService.generateToken(user);

        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), token);
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepositoryPort.findByEmail(request.email()).isPresent()) {
            throw new AuthenticationException("User already exists");
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));

        User saved = userRepositoryPort.save(user);

        String token = jwtService.generateToken(saved);

        return new AuthResponse(saved.getId(), saved.getName(), saved.getEmail(), token);
    }
}