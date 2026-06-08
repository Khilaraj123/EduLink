// Check authentication
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = '../../login.html';
    }
    return user;
}

// Load user profile
function loadUserProfile() {
    const user = checkAuth();
    $('#userWelcome').html(`Welcome, ${user.name} <img src="${user.avatar}" width="30" class="rounded-circle">`);
    return user;
}

// Logout function
$('#logoutBtn').on('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    window.location.href = '../../login.html';
});

// Load student enrolled courses
function loadStudentCourses() {
    const user = checkAuth();
    $.getJSON('../../assets/data/courses.json', function(data) {
        const enrolled = data.courses.filter(c => user.enrolledCourses.includes(c.id));
        $('#enrolledCount').text(enrolled.length);
        
        let html = '';
        enrolled.forEach(course => {
            html += `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <img src="${course.image}" class="card-img-top" alt="${course.title}">
                        <div class="card-body">
                            <h5 class="card-title">${course.title}</h5>
                            <p class="card-text">${course.description.substring(0, 100)}...</p>
                            <a href="course-detail.html?id=${course.id}" class="btn btn-primary">Continue Learning</a>
                        </div>
                    </div>
                </div>
            `;
        });
        $('#myCoursesList').html(html || '<p>No courses enrolled yet. <a href="courses.html">Browse courses</a></p>');
    });
}

// Initialize page based on role
$(document).ready(function() {
    const user = checkAuth();
    
    // Role-based page access control
    const currentPage = window.location.pathname;
    if (user.role === 'student' && !currentPage.includes('/student/')) {
        window.location.href = '../student/dashboard.html';
    } else if (user.role === 'instructor' && !currentPage.includes('/instructor/')) {
        window.location.href = '../instructor/dashboard.html';
    } else if (user.role === 'admin' && !currentPage.includes('/admin/')) {
        window.location.href = '../admin/dashboard.html';
    }
    
    loadUserProfile();
    
    // Load role-specific content
    if (user.role === 'student') {
        loadStudentCourses();
    } else if (user.role === 'instructor') {
        loadInstructorStats();
    } else if (user.role === 'admin') {
        loadAdminStats();
    }
});