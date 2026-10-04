package com.geoqr.attendance.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@DiscriminatorValue("STUDENT")
@Data
@EqualsAndHashCode(callSuper = true)
public class Student extends User {
    @Column(name = "roll_number")
    private String rollNumber;
}