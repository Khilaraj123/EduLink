let currentUser = null;
let revenueChart, courseDistributionChart;
let myCourses = [];

// Check authentication
function checkAuth() {
  const user = localStorage.getItem("currentUser");
  if (!user) {
    window.location.href = "../../login.html";
    return null;
  }
  currentUser = JSON.parse(user);
  if (currentUser.role !== "instructor") {
    window.location.href = `../../pages/${currentUser.role}/dashboard.html`;
    return null;
  }
  return currentUser;
}

// Load dashboard data
async function loadDashboardData() {
  try {
    // Load courses
    const coursesResponse = await fetch("../../data/courses.json");
    const coursesData = await coursesResponse.json();
    myCourses = coursesData.courses.filter(
      (c) => c.instructorId === currentUser.id,
    );

    // Load saved courses from localStorage
    loadSavedCourses();

    updateStats();
    initializeCharts();
    loadRecentActivities();
    loadRecentCourses();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    showToast("Error", "Failed to load dashboard data", "danger");
  }
}

// Load saved courses from localStorage
function loadSavedCourses() {
  const saved = localStorage.getItem(`instructor_courses_${currentUser.id}`);
  if (saved) {
    const savedCourses = JSON.parse(saved);
    savedCourses.forEach((savedCourse) => {
      if (!myCourses.find((c) => c.id === savedCourse.id)) {
        myCourses.push(savedCourse);
      }
    });
  }
}

// Update statistics
function updateStats() {
  const totalCourses = myCourses.length;
  const totalStudents = myCourses.reduce(
    (sum, course) => sum + (course.students || 0),
    0,
  );
  const totalRevenue = myCourses.reduce(
    (sum, course) => sum + course.price * (course.students || 0),
    0,
  );
  const avgRating =
    myCourses.length > 0
      ? (
          myCourses.reduce((sum, course) => sum + (course.rating || 0), 0) /
          myCourses.length
        ).toFixed(1)
      : 0;

  $("#totalCourses").text(totalCourses);
  $("#totalStudents").text(totalStudents.toLocaleString());
  $("#totalRevenue").text("$" + totalRevenue.toLocaleString());
  $("#avgRating").text(avgRating);

  // Animate numbers
  animateNumber("totalCourses", totalCourses);
  animateNumber("totalStudents", totalStudents);

  // Update trends (simulated)
  $("#courseTrend").html(
    '<i class="fas fa-arrow-up"></i> +' + (Math.random() * 5 + 1).toFixed(0),
  );
  $("#studentTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 20 + 5).toFixed(0) +
      "%",
  );
  $("#revenueTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 15 + 5).toFixed(0) +
      "%",
  );
  $("#ratingTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 0.5 + 0.1).toFixed(1),
  );
}

// Animate number counter
function animateNumber(elementId, targetValue) {
  const element = document.getElementById(elementId);
  if (!element) return;

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

// Initialize charts
function initializeCharts() {
  if (revenueChart) revenueChart.destroy();
  if (courseDistributionChart) courseDistributionChart.destroy();
  // Revenue Chart
  const revenueData = generateRevenueData();
  revenueChart = new Chart(document.getElementById("revenueChart"), {
    type: "line",
    data: {
      labels: revenueData.labels,
      datasets: [
        {
          label: "Revenue ($)",
          data: revenueData.revenue,
          borderColor: "#ffc107",
          backgroundColor: "rgba(255, 193, 7, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y",
        },
        {
          label: "Enrollments",
          data: revenueData.enrollments,
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
      },
      scales: {
        y: { title: { display: true, text: "Revenue ($)" } },
        y1: {
          position: "right",
          title: { display: true, text: "Enrollments" },
        },
      },
    },
  });

  // Course Distribution Chart
  const distributionData = generateDistributionData();
  courseDistributionChart = new Chart(
    document.getElementById("courseDistributionChart"),
    {
      type: "pie",
      data: {
        labels: distributionData.labels,
        datasets: [
          {
            data: distributionData.values,
            backgroundColor: [
              "#28a745",
              "#ffc107",
              "#17a2b8",
              "#dc3545",
              "#6610f2",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    },
  );
}

// Generate revenue data
function generateRevenueData() {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const revenue = months.map(() => Math.floor(Math.random() * 5000) + 1000);
  const enrollments = months.map(() => Math.floor(Math.random() * 50) + 10);
  return { labels: months, revenue, enrollments };
}

// Generate distribution data
function generateDistributionData() {
  const levels = { Beginner: 0, Intermediate: 0, Advanced: 0 };
  myCourses.forEach((course) => {
    if (course.level === "Beginner") levels.Beginner++;
    else if (course.level === "Intermediate") levels.Intermediate++;
    else if (course.level === "Advanced") levels.Advanced++;
  });

  return {
    labels: Object.keys(levels),
    values: Object.values(levels),
  };
}

// Load recent activities
function loadRecentActivities() {
  const activities = [
    {
      type: "student",
      action: "New enrollment",
      detail: "John Doe enrolled in Web Development",
      time: "2 hours ago",
      icon: "fa-user-plus",
    },
    {
      type: "course",
      action: "Course updated",
      detail: "Updated Python course curriculum",
      time: "5 hours ago",
      icon: "fa-edit",
    },
    {
      type: "revenue",
      action: "New sale",
      detail: "JavaScript Course - $49.99",
      time: "1 day ago",
      icon: "fa-dollar-sign",
    },
    {
      type: "student",
      action: "Assignment submitted",
      detail: "5 students submitted assignments",
      time: "2 days ago",
      icon: "fa-tasks",
    },
    {
      type: "course",
      action: "Review received",
      detail: "5-star review on React course",
      time: "3 days ago",
      icon: "fa-star",
    },
  ];

  let html = "";
  activities.forEach((activity) => {
    let iconClass = "";
    if (activity.type === "student") iconClass = "student";
    else if (activity.type === "course") iconClass = "course";
    else iconClass = "revenue";

    html += `
                    <div class="activity-item">
                        <div class="activity-icon ${iconClass}">
                            <i class="fas ${activity.icon}"></i>
                        </div>
                        <div class="flex-grow-1">
                            <strong>${escapeHtml(activity.action)}</strong>
                            <br>
                            <small>${escapeHtml(activity.detail)}</small>
                            <br>
                            <small class="text-muted">${escapeHtml(activity.time)}</small>
                        </div>
                    </div>
                `;
  });

  $("#recentActivities").html(html);
}

// Load recent courses
function loadRecentCourses() {
  const recentCourses = myCourses.slice(0, 5);

  if (recentCourses.length === 0) {
    $("#recentCourses").html(
      '<p class="text-muted text-center">No courses created yet.</p>',
    );
    return;
  }

  let html = "";
  recentCourses.forEach((course) => {
    html += `
                    <div class="course-item" onclick="window.location.href='course-detail.html?id=${course.id}'">
                        <img src="${escapeHtml(course.image)}" class="course-thumb" alt="${escapeHtml(course.title)}">
                        <div class="flex-grow-1">
                            <strong>${escapeHtml(course.title)}</strong>
                            <br>
                            <div class="rating-stars">
                                ${generateStarRating(course.rating || 0)}
                                <small class="text-muted">(${course.rating || 0})</small>
                            </div>
                            <small class="text-muted">
                                <i class="fas fa-users"></i> ${course.students || 0} students | 
                                <i class="fas fa-dollar-sign"></i> ${course.price}
                            </small>
                        </div>
                        <i class="fas fa-chevron-right text-muted"></i>
                    </div>
                `;
  });

  $("#recentCourses").html(html);
}

// Generate star rating
function generateStarRating(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += `<i class="${i <= rating ? "fas" : "far"} fa-star"></i>`;
  }
  return stars;
}

// View all activities
function viewAllActivities() {
  showToast("Info", "Full activity log coming soon!", "info");
}

// Generate report
function generateReport() {
  const report = {
    instructor: currentUser.name,
    date: new Date().toISOString(),
    totalCourses: myCourses.length,
    totalStudents: myCourses.reduce((sum, c) => sum + (c.students || 0), 0),
    totalRevenue: myCourses.reduce(
      (sum, c) => sum + c.price * (c.students || 0),
      0,
    ),
    courses: myCourses.map((c) => ({
      title: c.title,
      students: c.students,
      revenue: c.price * (c.students || 0),
      rating: c.rating,
    })),
  };

  const dataStr = JSON.stringify(report, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const exportFileDefaultName = `instructor_report_${new Date().toISOString().split("T")[0]}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();

  showToast("Success", "Report generated and downloaded!", "success");
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Show toast notification
function showToast(title, message, type = "success") {
  const toastHtml = `
                <div class="toast align-items-center text-white bg-${type} border-0" role="alert" data-bs-autohide="true" data-bs-delay="3000">
                    <div class="d-flex">
                        <div class="toast-body">
                            <strong>${title}</strong><br>
                            ${message}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                    </div>
                </div>
            `;

  const $toastContainer = $(".toast-container");
  $toastContainer.append(toastHtml);
  const $toastEl = $toastContainer.children(".toast").last();
  const toast = new bootstrap.Toast($toastEl[0]);
  toast.show();
  $toastEl[0].addEventListener("hidden.bs.toast", function () {
    this.remove();
  });
}

// Load instructor profile
function loadInstructorProfile() {
  if (currentUser) {
    $("#instructorName").text(
      `Welcome back, ${currentUser.name.split(" ")[0]}!`,
    );
  }
}

// Auto-refresh data every 30 seconds
let refreshInterval = setInterval(() => {
  loadDashboardData();
}, 30000);

document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    clearInterval(refreshInterval);
  } else {
    refreshInterval = setInterval(() => {
      loadDashboardData();
    }, 30000);
  }
});

// Logout
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "../../login.html";
}

// Event listeners
$(document).ready(function () {
  checkAuth();
  loadInstructorProfile();
  loadDashboardData();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
