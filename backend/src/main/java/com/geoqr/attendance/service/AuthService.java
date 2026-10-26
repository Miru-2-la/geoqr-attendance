package com.geoqr.attendance.service;

import com.geoqr.attendance.dto.LoginRequest;
import com.geoqr.attendance.dto.LoginResponse;
import com.geoqr.attendance.exception.ResourceNotFoundException;
import com.geoqr.attendance.model.Admin;
import com.geoqr.attendance.model.Student;
import com.geoqr.attendance.model.User;
import com.geoqr.attendance.repository.UserRepository;
import com.geoqr.attendance.security.JwtService;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailAndPassword(
                        request.getEmail(),
                        request.getPassword())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid email or password"));

        String actualRole = user instanceof Admin ? "ADMIN" : "STUDENT";
        if (!actualRole.equals(request.getRole())) {
            throw new ResourceNotFoundException("Invalid role selected");
        }

        String token = jwtService.generateAccessToken(
                String.valueOf(user.getId()),
                Map.of("email", user.getEmail(), "role", actualRole)
        );

        LoginResponse.UserDTO userDTO = new LoginResponse.UserDTO();
        userDTO.setId(user.getId());
        userDTO.setName(user.getName());
        userDTO.setEmail(user.getEmail());
        userDTO.setRole(actualRole);

        if (user instanceof Student) {
            userDTO.setRollNumber(((Student) user).getRollNumber());
        } else if (user instanceof Admin) {
            userDTO.setAdminCode(((Admin) user).getAdminCode());
        }

        return new LoginResponse(token, userDTO);
    }
}