let currentUser = null;
let userGrowthChart, revenueChart, coursePopularityChart, salesTrendChart;
let allCourses = [];
let allUsers = [];

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

// Load data
async function loadData() {
  try {
    // Load users
    const usersResponse = await fetch("../../assets/data/users.json");
    const usersData = await usersResponse.json();
    allUsers = usersData.users;

    // Load courses
    const coursesResponse = await fetch("../../assets/data/courses.json");
    const coursesData = await coursesResponse.json();
    allCourses = coursesData.courses;

    updateAnalytics();
  } catch (error) {
    console.error("Error loading data:", error);
    showToast("Error", "Failed to load analytics data", "danger");
  }
}

// Update analytics based on date range
function updateAnalytics() {
  const days = parseInt($("#dateRange").val());
  updateStats(days);
  updateCharts(days);
  updateTopCourses();
  updateUserActivity();
}

// Update statistics cards
function updateStats(days) {
  // Total users
  const totalUsers = allUsers.length;
  $("#totalUsers").text(totalUsers.toLocaleString());

  // Total courses
  const totalCourses = allCourses.length;
  $("#totalCourses").text(totalCourses);

  // Total revenue (simulated)
  const totalRevenue = allCourses.reduce(
    (sum, course) => sum + course.price * course.students,
    0,
  );
  $("#totalRevenue").text("$" + totalRevenue.toLocaleString());

  // Engagement rate (simulated)
  const engagementRate = Math.floor(Math.random() * 30) + 60;
  $("#engagementRate").text(engagementRate + "%");

  // Trends (simulated)
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
  $("#engagementTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 8 + 2).toFixed(0) +
      "%",
  );
}

// Update charts
function updateCharts(days) {
  // User Growth Chart
  const userGrowthData = generateTimeSeriesData(days, allUsers.length);
  if (userGrowthChart) userGrowthChart.destroy();
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

  // Revenue Breakdown Chart
  const revenueData = generateRevenueBreakdown();
  revenueChart = new Chart(document.getElementById("revenueChart"), {
    type: "pie",
    data: {
      labels: revenueData.labels,
      datasets: [
        {
          data: revenueData.values,
          backgroundColor: [
            "#007bff",
            "#28a745",
            "#ffc107",
            "#dc3545",
            "#17a2b8",
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
  });

  // Course Popularity Chart
  const popularCourses = allCourses
    .sort((a, b) => b.students - a.students)
    .slice(0, 5);
  coursePopularityChart = new Chart(
    document.getElementById("coursePopularityChart"),
    {
      type: "bar",
      data: {
        labels: popularCourses.map((c) => c.title.substring(0, 20)),
        datasets: [
          {
            label: "Number of Students",
            data: popularCourses.map((c) => c.students),
            backgroundColor: "#28a745",
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
        },
      },
    },
  );

  // Sales Trend Chart
  const salesData = generateSalesTrend(days);
  salesTrendChart = new Chart(document.getElementById("salesTrendChart"), {
    type: "line",
    data: {
      labels: salesData.labels,
      datasets: [
        {
          label: "Sales ($)",
          data: salesData.values,
          borderColor: "#ffc107",
          backgroundColor: "rgba(255, 193, 7, 0.1)",
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
}

// Generate time series data
function generateTimeSeriesData(days, baseValue) {
  const labels = [];
  const values = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    labels.push(date.toLocaleDateString());

    // Simulate growth
    const growth = (i / days) * baseValue;
    const random = Math.random() * baseValue * 0.1;
    values.push(Math.floor(growth + random));
  }

  return { labels, values };
}

// Generate revenue breakdown
function generateRevenueBreakdown() {
  const categories = [
    "Course Sales",
    "Subscriptions",
    "Certifications",
    "Workshops",
    "Other",
  ];
  const values = categories.map(
    () => Math.floor(Math.random() * 50000) + 10000,
  );
  return { labels: categories, values };
}

// Generate sales trend
function generateSalesTrend(days) {
  const labels = [];
  const values = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    labels.push(date.toLocaleDateString());
    values.push(Math.floor(Math.random() * 5000) + 1000);
  }

  return { labels, values };
}

// Update top courses table
function updateTopCourses() {
  const topCourses = allCourses
    .sort((a, b) => b.students - a.students)
    .slice(0, 10);
  let html = "";

  topCourses.forEach((course, index) => {
    const revenue = course.price * course.students;
    const performance = (course.students / topCourses[0].students) * 100;

    html += `
                    <tr>
                        <td><span class="badge bg-${index < 3 ? "warning" : "secondary"}">${index + 1}</span></td>
                        <td>${course.title}</td>
                        <td>${course.instructorName}</td>
                        <td>${course.students.toLocaleString()}</td>
                        <td>$${revenue.toLocaleString()}</td>
                        <td>
                            <i class="fas fa-star text-warning"></i> ${course.rating}
                        </td>
                        <td>
                            <div class="performance-indicator">
                                <div class="performance-bar" style="width: ${performance}%"></div>
                            </div>
                            <small>${performance.toFixed(0)}%</small>
                        </td>
                    </tr>
                `;
  });

  $("#topCoursesBody").html(html);
}

// Update user activity table
function updateUserActivity() {
  const students = allUsers.filter((u) => u.role === "student");
  const instructors = allUsers.filter((u) => u.role === "instructor");
  const admins = allUsers.filter((u) => u.role === "admin");

  const userTypes = [
    { name: "Students", users: students, color: "primary" },
    { name: "Instructors", users: instructors, color: "success" },
    { name: "Administrators", users: admins, color: "danger" },
  ];

  let html = "";
  userTypes.forEach((type) => {
    const active = Math.floor(type.users.length * (Math.random() * 0.3 + 0.6));
    const newUsers = Math.floor(type.users.length * (Math.random() * 0.1));
    const growth = ((newUsers / type.users.length) * 100).toFixed(1);
    const engagement = Math.floor(Math.random() * 40) + 50;

    html += `
                    <tr>
                        <td><strong>${type.name}</strong></td>
                        <td>${type.users.length.toLocaleString()}</td>
                        <td>${active.toLocaleString()}</td>
                        <td>+${newUsers}</td>
                        <td class="text-success">+${growth}%</td>
                        <td>
                            <div class="performance-indicator">
                                <div class="performance-bar" style="width: ${engagement}%"></div>
                            </div>
                            <small>${engagement}%</small>
                        </td>
                    </tr>
                `;
  });

  $("#userActivityBody").html(html);
}

// Export chart as image
function exportChart(chartId) {
  let chart;
  switch (chartId) {
    case "userGrowth":
      chart = userGrowthChart;
      break;
    case "revenueBreakdown":
      chart = revenueChart;
      break;
    case "coursePopularity":
      chart = coursePopularityChart;
      break;
    case "salesTrend":
      chart = salesTrendChart;
      break;
  }

  if (chart) {
    const link = document.createElement("a");
    link.download = `${chartId}.png`;
    link.href = chart.canvas.toDataURL();
    link.click();
    showToast("Success", "Chart exported successfully!", "success");
  }
}

// Export table to CSV
function exportTableToCSV(tableId) {
  let csv = [];
  if (tableId === "topCourses") {
    const rows = document.querySelectorAll("#topCoursesTable tr");
    for (let i = 0; i < rows.length; i++) {
      const row = [],
        cols = rows[i].querySelectorAll("td, th");
      for (let j = 0; j < cols.length; j++) {
        row.push(cols[j].innerText);
      }
      csv.push(row.join(","));
    }
  }

  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${tableId}.csv`;
  link.click();
  showToast("Success", "Table exported successfully!", "success");
}

// Scroll to section
function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Info", `Scrolled to ${sectionId} section`, "info");
  }
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
    $("#adminWelcome").html(
      `<i class="fas fa-user-shield"></i> Welcome, ${currentUser.name}`,
    );
  }
}

// Logout
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "../../login.html";
}

// Refresh data every 30 seconds
setInterval(() => {
  updateAnalytics();
}, 30000);

// Event listeners
$(document).ready(function () {
  checkAuth();
  loadAdminProfile();
  loadData();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
