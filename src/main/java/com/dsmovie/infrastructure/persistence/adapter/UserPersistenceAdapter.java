package com.dsmovie.infrastructure.persistence.adapter;

import com.dsmovie.application.port.out.UserRepositoryPort;
import com.dsmovie.domain.model.User;
import com.dsmovie.infrastructure.persistence.entity.RoleEntity;
import com.dsmovie.infrastructure.persistence.entity.UserEntity;
import com.dsmovie.infrastructure.persistence.repository.RoleJpaRepository;
import com.dsmovie.infrastructure.persistence.repository.UserJpaRepository;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;

@Component
public class UserPersistenceAdapter implements UserRepositoryPort {

    private final UserJpaRepository userJpaRepository;
    private final RoleJpaRepository roleJpaRepository;

    public UserPersistenceAdapter(UserJpaRepository userJpaRepository,
                                  RoleJpaRepository roleJpaRepository) {
        this.userJpaRepository = userJpaRepository;
        this.roleJpaRepository = roleJpaRepository;
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userJpaRepository.findByEmail(email)
                .map(this::toDomain);
    }

    @Override
    public Optional<User> findById(Long userId) {
        return userJpaRepository.findById(userId)
                .map(this::toDomain);
    }

    @Override
    public User save(User user) {
        UserEntity entity = toEntity(user);
        UserEntity saved = userJpaRepository.save(entity);
        return toDomain(saved);
    }

    private User toDomain(UserEntity entity) {
        Set<User.Role> roles = new LinkedHashSet<>();
        for (RoleEntity role : entity.getRoles()) {
            if ("ROLE_ADMIN".equalsIgnoreCase(role.getAuthority())) {
                roles.add(User.Role.ADMIN);
            } else if ("ROLE_USER".equalsIgnoreCase(role.getAuthority())) {
                roles.add(User.Role.USER);
            }
        }

        if (roles.size() != 1) {
            throw new IllegalStateException("User must have exactly one role: " + entity.getId());
        }

        User user = new User(
            entity.getId(), entity.getName(), entity.getEmail(), entity.getPassword()
        );
        user.setRoles(roles);
        return user;
    }

    private UserEntity toEntity(User user) {
        UserEntity entity = new UserEntity();
        entity.setId(user.getId());
        entity.setName(user.getName());
        entity.setEmail(user.getEmail());
        entity.setPassword(user.getPassword());
        entity.setRoles(new LinkedHashSet<>(roleEntities(user)));
        return entity;
    }

    private Set<RoleEntity> roleEntities(User user) {
        Set<RoleEntity> roles = new LinkedHashSet<>();
        for (User.Role role : user.getRoles()) {
            String authority = role == User.Role.ADMIN ? "ROLE_ADMIN" : "ROLE_USER";
            RoleEntity roleEntity = roleJpaRepository.findByAuthority(authority)
                    .orElseThrow(() -> new IllegalStateException("Required role is missing in tb_role: " + authority));
            roles.add(roleEntity);
        }
        if (roles.size() != 1) {
            throw new IllegalStateException("A user must have exactly one role");
        }
        return roles;
    }
}