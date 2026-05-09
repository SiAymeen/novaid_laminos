package com.novaid.dto;

public class JwtResponse {

    private String token;
    private final String type = "Bearer";
    private Long id;
    private String fullName;
    private String email;
    private String role;

    public JwtResponse(String token, Long id, String fullName, String email, String role) {
        this.token = token;
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
    }

    public String getToken() { return token; }
    public String getType() { return type; }
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
}
