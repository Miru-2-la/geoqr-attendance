package com.geoqr.attendance.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.geoqr.attendance.dto.LoginRequest;
import com.geoqr.attendance.dto.LoginResponse;
import com.geoqr.attendance.model.Admin;
import com.geoqr.attendance.model.Student;
import com.geoqr.attendance.model.User;
import com.geoqr.attendance.repository.UserRepository;
import com.geoqr.attendance.exception.ApiException;
import com.geoqr.attendance.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    
    public AuthService(UserRepository userRepository, PasswordEncoder encoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
    
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid email or password."));

        
        if (!encoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid email or password.");
        }

        // 3. Check role
        String actualRole = user instanceof Admin ? "ADMIN" : "STUDENT";
        if (!actualRole.equalsIgnoreCase(request.getRole())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid role selected.");
        }


        String token = jwtService.generate(user.getId(), user.getEmail(), actualRole);
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