// Simple authentication handling
$(document).ready(function() {
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        const email = $('#email').val();
        const password = $('#password').val();
        
        // Fetch users from JSON
        $.getJSON('data/users.json', function(data) {
            const user = data.users.find(u => u.email === email && u.password === password);
            
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // Redirect based on role
                if (user.role === 'student') {
                    window.location.href = 'pages/student/dashboard.html';
                } else if (user.role === 'instructor') {
                    window.location.href = 'pages/instructor/dashboard.html';
                } else if (user.role === 'admin') {
                    window.location.href = 'pages/admin/dashboard.html';
                }
            } else {
                alert('Invalid credentials!');
            }
        });
    });
});