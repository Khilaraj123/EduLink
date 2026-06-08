let currentUser = null;
let userGrowthChart, revenueChart;
let allUsers = [];
let allCourses = [];
let allClassrooms = [];

// Check authentication
function checkAuth() {
  const user = localStorage.getItem("currentUser");
  if (!user) {
    window.location.href = "../../login.html";
    return null;
  }
  currentUser = JSON.parse(user);
  if (currentUser.role !== "admin") {
    window.location.href = `../../pages/${currentUser.role}/dashboard.html`;
    return null;
  }
  return currentUser;
}

// Load dashboard data
async function loadDashboardData() {
  try {
    // Load users
    const usersResponse = await fetch("../../assets/data/users.json");
    const usersData = await usersResponse.json();
    allUsers = usersData.users;

    // Load courses
    const coursesResponse = await fetch("../../assets/data/courses.json");
    const coursesData = await coursesResponse.json();
    allCourses = coursesData.courses;

    // Load classrooms
    const classroomsResponse = await fetch("../../assets/data/classrooms.json");
    const classroomsData = await classroomsResponse.json();
    allClassrooms = classroomsData.classrooms;

    updateStats();
    initializeCharts();
    loadRecentActivities();
    loadRecentCourses();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    showToast("Error", "Failed to load dashboard data", "danger");
  }
}

// Update statistics
function updateStats() {
  const totalUsers = allUsers.length;
  const totalCourses = allCourses.length;
  const totalClassrooms = allClassrooms.length;
  const totalRevenue = allCourses.reduce(
    (sum, course) => sum + course.price * course.students,
    0,
  );

  $("#totalUsers").text(totalUsers.toLocaleString());
  $("#totalCourses").text(totalCourses);
  $("#totalRevenue").text("$" + totalRevenue.toLocaleString());
  $("#totalClassrooms").text(totalClassrooms);

  // Animate numbers
  animateNumber("totalUsers", totalUsers);
  animateNumber("totalCourses", totalCourses);
  animateNumber("totalClassrooms", totalClassrooms);

  // Update trends (simulated)
  $("#userTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 15 + 5).toFixed(0) +
      "%",
  );
  $("#courseTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 10 + 3).toFixed(0) +
      "%",
  );
  $("#revenueTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 20 + 10).toFixed(0) +
      "%",
  );
  $("#classroomTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 8 + 2).toFixed(0) +
      "%",
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
  // User Growth Chart
  const userGrowthData = generateUserGrowthData();
  userGrowthChart = new Chart(document.getElementById("userGrowthChart"), {
    type: "line",
    data: {
      labels: userGrowthData.labels,
      datasets: [
        {
          label: "Total Users",
          data: userGrowthData.values,
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
      },
    },
  });

  // Revenue Chart
  revenueChart = new Chart(document.getElementById("revenueChart"), {
    type: "pie",
    data: {
      labels: ["Course Sales", "Subscriptions", "Certifications", "Workshops"],
      datasets: [
        {
          data: [65, 20, 10, 5],
          backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });
}

// Generate user growth data
function generateUserGrowthData() {
  const labels = [];
  const values = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    labels.push(date.toLocaleString("default", { month: "short" }));
    values.push(Math.floor(Math.random() * 200) + 100);
  }
  return { labels, values };
}

// Load recent activities
function loadRecentActivities() {
  const activities = [
    {
      type: "user",
      action: "New user registered",
      detail: "John Doe joined as Student",
      time: "5 minutes ago",
      icon: "fa-user-plus",
    },
    {
      type: "course",
      action: "New course published",
      detail: "Advanced React Course",
      time: "1 hour ago",
      icon: "fa-book",
    },
    {
      type: "sale",
      action: "Course purchase",
      detail: "JavaScript Course sold to Sarah",
      time: "2 hours ago",
      icon: "fa-dollar-sign",
    },
    {
      type: "user",
      action: "Instructor onboarded",
      detail: "Prof. Johnson joined as Instructor",
      time: "3 hours ago",
      icon: "fa-chalkboard-teacher",
    },
    {
      type: "course",
      action: "Course updated",
      detail: "Python Bootcamp curriculum updated",
      time: "5 hours ago",
      icon: "fa-edit",
    },
    {
      type: "sale",
      action: "Subscription purchase",
      detail: "Premium plan purchased by Mike",
      time: "1 day ago",
      icon: "fa-trophy",
    },
  ];

  let html = "";
  activities.forEach((activity) => {
    let iconClass = "";
    if (activity.type === "user") iconClass = "user";
    else if (activity.type === "course") iconClass = "course";
    else iconClass = "sale";

    html += `
                    <div class="activity-item">
                        <div class="d-flex align-items-center">
                            <div class="activity-icon ${iconClass}">
                                <i class="fas ${activity.icon}"></i>
                            </div>
                            <div class="flex-grow-1">
                                <strong>${activity.action}</strong>
                                <br>
                                <small>${activity.detail}</small>
                                <br>
                                <small class="text-muted">${activity.time}</small>
                            </div>
                        </div>
                    </div>
                `;
  });

  $("#recentActivities").html(html);
}

// Load recent courses
function loadRecentCourses() {
  const recentCourses = allCourses.slice(0, 5);

  if (recentCourses.length === 0) {
    $("#recentCourses").html(
      '<p class="text-muted text-center">No courses added yet.</p>',
    );
    return;
  }

  let html = "";
  recentCourses.forEach((course) => {
    html += `
                    <div class="recent-course-item" onclick="window.location.href='course-detail.html?id=${course.id}'">
                        <img src="${course.image}" class="course-thumb" alt="${course.title}">
                        <div class="flex-grow-1">
                            <strong>${course.title}</strong>
                            <br>
                            <small class="text-muted">
                                <i class="fas fa-user"></i> ${course.instructorName} | 
                                <i class="fas fa-users"></i> ${course.students} students | 
                                <i class="fas fa-dollar-sign"></i> ${course.price}
                            </small>
                        </div>
                        <i class="fas fa-chevron-right text-muted"></i>
                    </div>
                `;
  });

  $("#recentCourses").html(html);
}

// Load more activities
function loadMoreActivities() {
  showToast("Info", "Viewing all activities feature coming soon!", "info");
}

// Generate report
function generateReport() {
  const report = {
    date: new Date().toISOString(),
    totalUsers: allUsers.length,
    totalCourses: allCourses.length,
    totalRevenue: allCourses.reduce((sum, c) => sum + c.price * c.students, 0),
    topCourses: allCourses.sort((a, b) => b.students - a.students).slice(0, 5),
  };

  // Create JSON report
  const dataStr = JSON.stringify(report, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportFileDefaultName = `admin_report_${new Date().toISOString().split("T")[0]}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();

  showToast("Success", "Report generated and downloaded!", "success");
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

  $(".toast-container").append(toastHtml);
  const toast = new bootstrap.Toast($(".toast").last()[0]);
  toast.show();

  $(".toast")
    .last()[0]
    .addEventListener("hidden.bs.toast", function () {
      this.remove();
    });
}

// Load admin profile
function loadAdminProfile() {
  if (currentUser) {
    $("#adminName").text(`Welcome back, ${currentUser.name.split(" ")[0]}!`);
  }
}

// Auto-refresh data every 30 seconds
setInterval(() => {
  loadDashboardData();
}, 30000);

// Logout
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "../../login.html";
}

// Event listeners
$(document).ready(function () {
  checkAuth();
  loadAdminProfile();
  loadDashboardData();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
