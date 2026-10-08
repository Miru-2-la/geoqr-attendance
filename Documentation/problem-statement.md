# Problem Statement

## Current Challenges in Attendance Management

### 1. Proxy Attendance
In traditional attendance systems, students can easily mark attendance
for friends who are absent. Manual roll calls and signature sheets are
especially vulnerable to this, particularly in large classrooms where
the instructor cannot verify each student's identity.

### 2. Time Inefficiency
Manual attendance takes 5-10 minutes of lecture time per session. Over
a semester of 40+ lectures, this adds up to more than 6 hours of lost
teaching time.

### 3. Lack of Real-Time Visibility
Instructors and administrators cannot see attendance patterns as they
develop. At-risk students are only noticed when it is too late in the
semester to help them.

### 4. No Geographical Verification
Existing digital solutions (Google Forms, basic QR scanners) do not
verify that the student is physically present. A student can mark
attendance from a hostel or from home.

### 5. Manual Report Generation
Compiling attendance reports for academic compliance is done by hand,
which is slow and error-prone.

## Proposed Solution

The QR-Based Geo-Tagged Attendance Management System addresses these
challenges as follows:

| Challenge | Solution |
|-----------|----------|
| Proxy attendance | Device fingerprinting detects the same device being used for multiple students |
| Time inefficiency | Entering the event identifier completes attendance in seconds |
| No real-time visibility | Admin dashboard with live analytics and alerts |
| No location verification | Haversine formula checks the student's GPS distance from the event |
| Manual reports | Automated CSV/PDF report download |

## Scope of the Project

### In Scope
- User authentication (Admin and Student roles)
- Event creation with location coordinates
- QR code generation for each event
- JavaFX desktop client for administrators and students
- Geo-location verification (default 50 m radius)
- Device-based proxy detection
- Admin dashboard with attendance records
- At-risk student identification (below 75% attendance)
- Attendance trend visualization
- CSV/PDF report export

### Out of Scope (Future Scope)
- Face recognition integration
- Offline attendance mode
- Native mobile application
- Machine learning dropout prediction
- Cloud deployment
- Email/SMS notifications