package com.dsmovie.infrastructure.persistence.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_role")
public class RoleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String authority;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAuthority() { return authority; }
    public void setAuthority(String authority) { this.authority = authority; }
}