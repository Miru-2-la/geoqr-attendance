/* ============================================
   GEOQR ATTENDANCE - ADMIN DASHBOARD LOGIC
   ============================================ */

let currentUser = null;
let trendChart = null;


/* ============================================
   INITIALIZATION
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    checkAuth();

    if (!currentUser) {
        return;
    }

    loadUserData();
    setupTabNavigation();
    setupEventForm();
    loadDashboardData();

    // Set today's date
    const eventDate = document.getElementById('eventDate');

    if (eventDate) {
        eventDate.valueAsDate = new Date();
    }

});


/* ============================================
   AUTHENTICATION CHECK
   ============================================ */

function checkAuth() {

    const user = localStorage.getItem(
        CONFIG.USER_KEY
    );

    if (!user) {

        window.location.href = 'index.html';

        return;
    }

    try {

        currentUser = JSON.parse(user);

    } catch (error) {

        console.error(
            'Invalid user data:',
            error
        );

        localStorage.removeItem(
            CONFIG.USER_KEY
        );

        window.location.href = 'index.html';

        return;
    }

    if (currentUser.role !== 'ADMIN') {

        window.location.href = 'student.html';

        return;
    }

}


/* ============================================
   LOAD USER DATA
   ============================================ */

function loadUserData() {

    const userName =
        document.getElementById('userName');

    if (userName && currentUser) {

        userName.textContent =
            currentUser.name;
    }

}


/* ============================================
   TAB NAVIGATION
   ============================================ */

function setupTabNavigation() {

    const navLinks =
        document.querySelectorAll('.nav-link');

    const tabContents =
        document.querySelectorAll('.tab-content');


    navLinks.forEach(link => {

        link.addEventListener('click', event => {

            event.preventDefault();

            const tabName =
                link.dataset.tab;


            // Update active navigation
            navLinks.forEach(item => {

                item.classList.remove('active');

            });

            link.classList.add('active');


            // Show selected tab
            tabContents.forEach(content => {

                content.classList.remove('active');

                if (
                    content.id ===
                    `${tabName}-tab`
                ) {

                    content.classList.add('active');
                }

            });


            // Load analytics when opened
            if (tabName === 'analytics') {

                loadAnalytics();
            }
            
            // Load my events when opened
            if (tabName === 'my-events') {

                loadMyEvents();
            }
        });

    });

}


/* ============================================
   EVENT CREATION
   ============================================ */

function setupEventForm() {

    const form =
        document.getElementById('eventForm');


    if (!form) {
        return;
    }


    form.addEventListener(
        'submit',
        async event => {

            event.preventDefault();


            const eventData = {

                title:
                    document.getElementById(
                        'eventTitle'
                    ).value,

                description:
                    document.getElementById(
                        'eventDescription'
                    ).value,

                eventDate:
                    document.getElementById(
                        'eventDate'
                    ).value,

                startTime:
                    document.getElementById(
                        'startTime'
                    ).value,

                endTime:
                    document.getElementById(
                        'endTime'
                    ).value,

                latitude:
                    parseFloat(
                        document.getElementById(
                            'latitude'
                        ).value
                    ),

                longitude:
                    parseFloat(
                        document.getElementById(
                            'longitude'
                        ).value
                    ),

                radiusMeters:
                    parseInt(
                        document.getElementById(
                            'radiusMeters'
                        ).value
                    ),

                createdBy:
                    currentUser.id

            };


            try {

                const response =
                    await fetch(
                        `${CONFIG.API_BASE_URL}/events`,
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify(
                                    eventData
                                )
                        }
                    );


                const result =
                    await response.json();


                if (
                    result.status ===
                    'SUCCESS'
                ) {

                    const eventId =
                        result.data.id;


                    // Generate QR
                    generateQRCode(eventId);


                    showMessage(
                        'Event created successfully!',
                        'success'
                    );


                    // Reset form
                    form.reset();


                    // Restore default values
                    document
                        .getElementById(
                            'eventDate'
                        )
                        .valueAsDate =
                        new Date();


                    document
                        .getElementById(
                            'latitude'
                        )
                        .value =
                        '12.9716';


                    document
                        .getElementById(
                            'longitude'
                        )
                        .value =
                        '77.5946';


                    document
                        .getElementById(
                            'radiusMeters'
                        )
                        .value =
                        '50';

                } else {

                    showMessage(
                        result.message ||
                        'Failed to create event',
                        'error'
                    );
                }


            } catch (error) {

                console.error(
                    'Error creating event:',
                    error
                );

                showMessage(
                    'Connection error. Please try again.',
                    'error'
                );

            }

        }
    );

}


/* ============================================
   QR CODE GENERATION
   ============================================ */

function generateQRCode(eventId) {

    const qrContainer =
        document.getElementById('qrcode');


    if (!qrContainer) {
        return;
    }


    // Clear previous QR
    qrContainer.innerHTML = '';


    /*
       Event ID is encoded as JSON
       as required by the project.
    */

    new QRCode(qrContainer, {

        text: JSON.stringify({
            eventId: eventId
        }),

        width: 256,

        height: 256,

        correctLevel:
            QRCode.CorrectLevel.H

    });

}


/* ============================================
   DASHBOARD DATA
   ============================================ */

async function loadDashboardData() {

    try {

        const response =
            await fetch(
                `${CONFIG.API_BASE_URL}/attendance/recent`
            );


        const result =
            await response.json();


        /*
           Backend handover uses the generic
           SUCCESS/ERROR wrapper.
        */

        if (
            result.status === 'SUCCESS'
        ) {

            updateRecentAttendance(
                result.data
            );

        } else if (
            Array.isArray(result)
        ) {

            // Also accept direct array response
            updateRecentAttendance(result);

        }


    } catch (error) {

        console.error(
            'Error loading dashboard data:',
            error
        );

    }

}


/* ============================================
   RECENT ATTENDANCE TABLE
   ============================================ */

function updateRecentAttendance(
    attendanceList
) {

    const tbody =
        document.getElementById(
            'recentAttendance'
        );


    if (!tbody) {
        return;
    }


    if (
        !attendanceList ||
        attendanceList.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="text-center text-muted"
                >
                    No attendance records yet.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        attendanceList
            .slice(0, 10)
            .map(record => {

                return `
                    <tr>

                        <td>
                            Student #${record.studentId}
                        </td>

                        <td>
                            Event #${record.eventId}
                        </td>

                        <td>
                            ${formatTime(
                                record.timestamp
                            )}
                        </td>

                        <td>
                            <span class="text-success">
                                ${record.status || 'SUCCESS'}
                            </span>
                        </td>

                    </tr>
                `;

            })
            .join('');

}


/* ============================================
   ANALYTICS
   ============================================ */

async function loadAnalytics() {

    try {

        // At-risk students
        const atRiskResponse =
            await fetch(
                `${CONFIG.API_BASE_URL}/analytics/at-risk`
            );


        const atRiskResult =
            await atRiskResponse.json();


        let atRiskStudents = [];


        if (
            Array.isArray(atRiskResult)
        ) {

            atRiskStudents =
                atRiskResult;

        } else if (
            atRiskResult.status ===
            'SUCCESS'
        ) {

            atRiskStudents =
                atRiskResult.data || [];

        }


        updateAtRiskTable(
            atRiskStudents
        );


        // Trend
        const trendResponse =
            await fetch(
                `${CONFIG.API_BASE_URL}/analytics/trend`
            );


        const trendResult =
            await trendResponse.json();


        let trendData = [];


        if (
            Array.isArray(trendResult)
        ) {

            trendData =
                trendResult;

        } else if (
            trendResult.status ===
            'SUCCESS'
        ) {

            trendData =
                trendResult.data || [];

        }


        updateTrendChart(trendData);


        // Calculate average attendance
        calculateAverageAttendance(
            atRiskStudents
        );


    } catch (error) {

        console.error(
            'Error loading analytics:',
            error
        );

        showMessage(
            'Unable to load analytics.',
            'error'
        );

    }

}


/* ============================================
   AT-RISK TABLE
   ============================================ */

function updateAtRiskTable(
    students
) {

    const tbody =
        document.querySelector(
            '#atRiskTable tbody'
        );


    const countElement =
        document.getElementById(
            'atRiskCount'
        );


    if (!tbody) {
        return;
    }


    if (countElement) {

        countElement.textContent =
            students.length;

    }


    if (
        !students ||
        students.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-muted"
                >
                    No at-risk students.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        students
            .map(student => {

                const percentage =
                    Number(
                        student.attendancePercentage
                    ).toFixed(2);


                return `
                    <tr>

                        <td>
                            ${student.name}
                        </td>

                        <td>
                            ${student.rollNumber}
                        </td>

                        <td>
                            ${student.eventsAttended}
                        </td>

                        <td>
                            ${percentage}%
                        </td>

                        <td>
                            <span class="text-danger">
                                At Risk
                            </span>
                        </td>

                    </tr>
                `;

            })
            .join('');

}


/* ============================================
   TREND CHART
   ============================================ */

function updateTrendChart(
    trendData
) {

    const canvas =
        document.getElementById(
            'trendChart'
        );


    if (!canvas) {
        return;
    }


    const labels =
        trendData.map(
            item => item.date
        );


    const counts =
        trendData.map(
            item => item.count
        );


    const ctx =
        canvas.getContext('2d');


    // Destroy previous chart
    if (trendChart) {

        trendChart.destroy();
    }


    trendChart =
        new Chart(ctx, {

            type: 'line',

            data: {

                labels: labels,

                datasets: [{

                    label:
                        'Attendance',

                    data:
                        counts,

                    tension:
                        0.3,

                    fill:
                        false

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio:
                    true,

                scales: {

                    y: {

                        beginAtZero:
                            true

                    }

                }

            }

        });

}


/* ============================================
   AVERAGE ATTENDANCE
   ============================================ */

function calculateAverageAttendance(
    students
) {

    const element =
        document.getElementById(
            'avgAttendance'
        );


    if (!element) {
        return;
    }


    /*
       The handover gives the at-risk
       student percentage data.

       We display an average when
       percentage values are available.
    */

    if (
        !students ||
        students.length === 0
    ) {

        element.textContent =
            '0%';

        return;
    }


    const values =
        students
            .map(
                student =>
                    Number(
                        student.attendancePercentage
                    )
            )
            .filter(
                value =>
                    !Number.isNaN(value)
            );


    if (values.length === 0) {

        element.textContent =
            '0%';

        return;
    }


    const average =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / values.length;


    element.textContent =
        `${average.toFixed(2)}%`;

}


/* ============================================
   REPORTS
   ============================================ */

async function downloadCSV() {

    try {

        const response =
            await fetch(
                `${CONFIG.API_BASE_URL}/reports/csv`
            );


        if (!response.ok) {

            throw new Error(
                'CSV download failed'
            );
        }


        const blob =
            await response.blob();


        downloadFile(
            blob,
            'attendance-report.csv'
        );


        showMessage(
            'CSV report downloaded.',
            'success'
        );


    } catch (error) {

        console.error(
            'CSV error:',
            error
        );

        showMessage(
            'Unable to download CSV.',
            'error'
        );

    }

}


async function downloadPDF() {

    try {

        const response =
            await fetch(
                `${CONFIG.API_BASE_URL}/reports/pdf`
            );


        if (!response.ok) {

            throw new Error(
                'PDF download failed'
            );
        }


        const blob =
            await response.blob();


        downloadFile(
            blob,
            'attendance-report.pdf'
        );


        showMessage(
            'PDF report downloaded.',
            'success'
        );


    } catch (error) {

        console.error(
            'PDF error:',
            error
        );

        showMessage(
            'Unable to download PDF.',
            'error'
        );

    }

}


/* ============================================
   FILE DOWNLOAD HELPER
   ============================================ */

function downloadFile(
    blob,
    filename
) {

    const url =
        window.URL.createObjectURL(blob);


    const link =
        document.createElement('a');


    link.href = url;

    link.download = filename;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    window.URL.revokeObjectURL(url);

}


/* ============================================
   MY EVENTS LIST
   ============================================ */

async function loadMyEvents() {

    const tbody = document.getElementById('myEventsBody');

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-muted">
                Loading events...
            </td>
        </tr>
    `;

    try {

        const response = await fetch(
            `${CONFIG.API_BASE_URL}/events/admin/${currentUser.id}`
        );

        const result = await response.json();

        const events = result.status === 'SUCCESS'
            ? (result.data || [])
            : [];

        if (events.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        No events created yet.
                    </td>
                </tr>
            `;

            return;
        }

        // Fetch attendance counts in parallel
        const counts = await Promise.all(
            events.map(ev =>
                fetch(`${CONFIG.API_BASE_URL}/attendance/count/${ev.id}`)
                    .then(r => r.json())
                    .then(r => r.status === 'SUCCESS' ? r.data : 0)
                    .catch(() => 0)
            )
        );

        tbody.innerHTML = events.map((ev, i) => {

            const date = ev.eventDate || '';
            const start = ev.startTime || '';
            const end = ev.endTime || '';

            return `
                <tr>
                    <td>${ev.id}</td>
                    <td>${ev.title}</td>
                    <td>${date}</td>
                    <td>${start} - ${end}</td>
                    <td>${ev.radiusMeters} m</td>
                    <td><strong>${counts[i]}</strong></td>
                    <td>
                        <button
                            class="btn btn-outline btn-sm"
                            onclick="showEventDetail(${ev.id})"
                        >
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {

        console.error('Error loading events:', error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    Failed to load events.
                </td>
            </tr>
        `;
    }
}


/* ============================================
   EVENT DETAIL MODAL
   ============================================ */

async function showEventDetail(eventId) {

    const modal = document.getElementById('eventDetailModal');

    if (!modal) return;

    // Show modal immediately with loading state
    modal.style.display = 'flex';

    document.getElementById('eventDetailTitle').textContent = 'Loading...';
    document.getElementById('eventDetailDate').textContent = '';
    document.getElementById('eventDetailTime').textContent = '';
    document.getElementById('eventDetailDescription').textContent = '';
    document.getElementById('eventDetailLocation').textContent = '';
    document.getElementById('eventDetailRadius').textContent = '';

    document.getElementById('eventAttendanceBody').innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-muted">
                Loading...
            </td>
        </tr>
    `;

    try {

        // Fetch event details
        const evRes = await fetch(`${CONFIG.API_BASE_URL}/events/${eventId}`);
        const evJson = await evRes.json();

        if (evJson.status !== 'SUCCESS') {
            throw new Error(evJson.message || 'Failed to load event');
        }

        const ev = evJson.data;

        document.getElementById('eventDetailTitle').textContent = ev.title || '';
        document.getElementById('eventDetailDate').textContent = ev.eventDate || '';
        document.getElementById('eventDetailTime').textContent =
            `${ev.startTime || ''} - ${ev.endTime || ''}`;
        document.getElementById('eventDetailDescription').textContent =
            ev.description || '(no description)';
        document.getElementById('eventDetailLocation').textContent =
            `${ev.latitude}, ${ev.longitude}`;
        document.getElementById('eventDetailRadius').textContent =
            ev.radiusMeters;

        // Fetch attendance for this event
        const attRes = await fetch(
            `${CONFIG.API_BASE_URL}/attendance/event/${eventId}`
        );
        const attJson = await attRes.json();

        const records = attJson.status === 'SUCCESS'
            ? (attJson.data || [])
            : [];

        const tbody = document.getElementById('eventAttendanceBody');

        if (records.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        No attendance records yet.
                    </td>
                </tr>
            `;

        } else {

            tbody.innerHTML = records.map(r => `
                <tr>
                    <td>${r.studentId}</td>
                    <td>${formatTime(r.timestamp)}</td>
                    <td>${r.distanceMeters ? r.distanceMeters.toFixed(2) + ' m' : '-'}</td>
                    <td>
                        <span class="${r.status === 'SUCCESS' ? 'text-success' : 'text-danger'}">
                            ${r.status || 'UNKNOWN'}
                        </span>
                    </td>
                </tr>
            `).join('');
        }

    } catch (error) {

        console.error('Error loading event detail:', error);

        document.getElementById('eventDetailTitle').textContent = 'Error';
        document.getElementById('eventAttendanceBody').innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    Failed to load event details.
                </td>
            </tr>
        `;
    }
}


function closeEventDetail() {

    const modal = document.getElementById('eventDetailModal');

    if (modal) {
        modal.style.display = 'none';
    }
}