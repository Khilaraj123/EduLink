// Hide loading spinner after page loads
window.addEventListener("load", function () {
  setTimeout(function () {
    document.getElementById("loadingOverlay").style.opacity = "0";
    setTimeout(function () {
      document.getElementById("loadingOverlay").style.display = "none";
    }, 500);
  }, 500);
});

// Check authentication on page load
function checkAuthentication() {
  const user = localStorage.getItem("currentUser");
  if (user) {
    // User is logged in, redirect to role-based dashboard
    const userData = JSON.parse(user);
    setTimeout(function () {
      if (userData.role === "student") {
        window.location.href = "pages/student/dashboard.html";
      } else if (userData.role === "instructor") {
        window.location.href = "pages/instructor/dashboard.html";
      } else if (userData.role === "admin") {
        window.location.href = "pages/admin/dashboard.html";
      }
    }, 1000);
    return true;
  }
  return false;
}

// Redirect to login page
function redirectToLogin() {
  window.location.href = "login.html";
}

// Scroll to section smoothly
function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}

// Load statistics
async function loadStatistics() {
  try {
    // Try to load from users.json
    const usersResponse = await fetch("assets/data/users.json");
    const usersData = await usersResponse.json();
    const totalStudents = usersData.users.filter(
      (u) => u.role === "student",
    ).length;
    const totalInstructors = usersData.users.filter(
      (u) => u.role === "instructor",
    ).length;

    // Load courses
    const coursesResponse = await fetch("assets/data/courses.json");
    const coursesData = await coursesResponse.json();
    const totalCourses = coursesData.courses.length;

    // Animate counting
    animateNumber("studentsCount", totalStudents);
    animateNumber("coursesCount", totalCourses);
    animateNumber("instructorsCount", totalInstructors);
    animateNumber("countriesCount", 50);
  } catch (error) {
    console.error("Error loading statistics:", error);
    // Set default values
    document.getElementById("studentsCount").textContent = "10,000+";
    document.getElementById("coursesCount").textContent = "500+";
    document.getElementById("instructorsCount").textContent = "200+";
    document.getElementById("countriesCount").textContent = "50+";
  }
}

// Animate number counter
function animateNumber(elementId, targetValue) {
  const element = document.getElementById(elementId);
  let currentValue = 0;
  const increment = targetValue / 50;
  const timer = setInterval(function () {
    currentValue += increment;
    if (currentValue >= targetValue) {
      element.textContent = targetValue.toLocaleString();
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(currentValue).toLocaleString();
    }
  }, 20);
}

// Load popular courses
async function loadPopularCourses() {
  try {
    const response = await fetch("assets/data/courses.json");
    const data = await response.json();
    const popularCourses = data.courses.slice(0, 3); // Get first 3 courses

    let html = "";
    popularCourses.forEach((course) => {
      html += `
            <div class="col-md-4">
              <div class="course-card">
                <img src="${course.image}" class="course-image" alt="${course.title}">
                <div class="course-body">
                  <h5 class="course-title">${course.title}</h5>
                  <p class="course-instructor">
                    <i class="fas fa-user"></i> ${course.instructorName}
                  </p>
                  <p class="course-description">${course.description.substring(0, 80)}...</p>
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="course-price">$${course.price}</span>
                    <button class="btn btn-primary btn-sm" onclick="redirectToLogin()">
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
    });

    document.getElementById("popularCourses").innerHTML = html;
  } catch (error) {
    console.error("Error loading courses:", error);
  }
}

// Navbar scroll effect
window.addEventListener("scroll", function () {
  const navbar = document.getElementById("navbar");
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// Initialize page
$(document).ready(function () {
  // Check if user is already logged in
  const isLoggedIn = checkAuthentication();

  // If not logged in, load public content
  if (!isLoggedIn) {
    loadStatistics();
    loadPopularCourses();
  }

  // Login button click handler
  $("#loginBtn").on("click", function (e) {
    e.preventDefault();
    redirectToLogin();
  });
});
