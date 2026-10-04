/* ============================================
   GEOQR ATTENDANCE - AUTHENTICATION
   ============================================ */

// Login form handler
//document
  //  .getElementById('loginForm')
    //.addEventListener('submit', handleLogin);
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

async function handleLogin(event) {

    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    const message = document.getElementById('loginMessage');

    message.textContent = 'Logging in...';
    message.style.color = 'var(--text-secondary)';

    try {

        const response = await fetch(
            `${CONFIG.API_BASE_URL}/auth/login`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    email: email,
                    password: password,
                    role: role
                })
            }
        );

        const result = await response.json();

        if (result.status === 'SUCCESS') {

            // Store token
            localStorage.setItem(
                CONFIG.TOKEN_KEY,
                result.data.token
            );

            // Store user information
            localStorage.setItem(
                CONFIG.USER_KEY,
                JSON.stringify(result.data.user)
            );

            message.textContent = 'Login successful!';
            message.style.color = 'var(--success)';

            // Redirect according to role
            if (result.data.user.role === 'ADMIN') {

                window.location.href = 'admin.html';

            } else {

                window.location.href = 'student.html';

            }

        } else {

            message.textContent =
                result.message || 'Login failed.';

            message.style.color = 'var(--danger)';
        }

    } catch (error) {

        console.error('Login error:', error);

        message.textContent =
            'Unable to connect to the server.';

        message.style.color = 'var(--danger)';
    }
}


// Fill Admin demo credentials
function fillAdminCredentials() {

    document.getElementById('email').value =
        'admin@geoqr.com';

    document.getElementById('password').value =
        'admin123';

    document.getElementById('role').value =
        'ADMIN';
}


// Fill Student demo credentials
function fillStudentCredentials() {

    document.getElementById('email').value =
        'student@geoqr.com';

    document.getElementById('password').value =
        'student123';

    document.getElementById('role').value =
        'STUDENT';
}


// Logout
function logout() {

    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);

    window.location.href = 'index.html';
}