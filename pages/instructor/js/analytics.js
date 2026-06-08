let currentUser = null;
let myCourses = [];
let enrollmentChart, courseDistributionChart, ratingsChart, progressChart;
let allStudents = [];
let courseProgress = {};

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

// Load instructor data
async function loadInstructorData() {
  try {
    // Load courses
    const coursesResponse = await fetch("../../assets/data/courses.json");
    const coursesData = await coursesResponse.json();
    myCourses = coursesData.courses.filter(
      (c) => c.instructorId === currentUser.id,
    );

    // Load users
    const usersResponse = await fetch("../../assets/data/users.json");
    const usersData = await usersResponse.json();
    allStudents = usersData.users.filter((u) => u.role === "student");

    // Populate course select
    populateCourseSelect();

    // Load progress data
    loadProgressData();

    updateAnalytics();
  } catch (error) {
    console.error("Error loading data:", error);
    showToast("Error", "Failed to load analytics data", "danger");
  }
}

// Populate course select dropdown
function populateCourseSelect() {
  let options = '<option value="all">All Courses</option>';
  myCourses.forEach((course) => {
    options += `<option value="${course.id}">${course.title}</option>`;
  });
  $("#courseSelect").html(options);
}

// Load progress data
function loadProgressData() {
  courseProgress = {};
  myCourses.forEach((course) => {
    const savedProgress = localStorage.getItem(`course_progress_${course.id}`);
    if (savedProgress) {
      courseProgress[course.id] = JSON.parse(savedProgress);
    }
  });
}

// Update analytics based on selection
function updateAnalytics() {
  const courseId = $("#courseSelect").val();
  const days = parseInt($("#dateRange").val());

  let filteredCourses = myCourses;
  if (courseId !== "all") {
    filteredCourses = myCourses.filter((c) => c.id === parseInt(courseId));
  }

  calculateStats(filteredCourses, days);
  updateCharts(filteredCourses);
  updateCoursePerformance(filteredCourses);
  updateStudentActivity(filteredCourses);
}

// Calculate statistics
function calculateStats(courses, days) {
  let totalStudents = 0;
  let totalRevenue = 0;
  let totalRating = 0;
  let totalCompletion = 0;

  courses.forEach((course) => {
    totalStudents += course.students || 0;
    totalRevenue += course.price * (course.students || 0);
    totalRating += course.rating || 0;

    // Calculate completion rate
    const progress = courseProgress[course.id];
    if (progress && course.curriculum) {
      const completedCount = progress.completedLessons?.length || 0;
      const completion = (completedCount / course.curriculum.length) * 100;
      totalCompletion += completion;
    }
  });

  const avgRating =
    courses.length > 0 ? (totalRating / courses.length).toFixed(1) : 0;
  const avgCompletion =
    courses.length > 0 ? (totalCompletion / courses.length).toFixed(0) : 0;

  $("#totalStudents").text(totalStudents.toLocaleString());
  $("#totalRevenue").text("$" + totalRevenue.toLocaleString());
  $("#avgRating").text(avgRating);
  $("#completionRate").text(avgCompletion + "%");

  // Update trends (simulated)
  $("#studentTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 15 + 5).toFixed(0) +
      "%",
  );
  $("#revenueTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 20 + 10).toFixed(0) +
      "%",
  );
  $("#ratingTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 0.5 + 0.1).toFixed(1),
  );
  $("#completionTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 8 + 2).toFixed(0) +
      "%",
  );
}

// Update charts
function updateCharts(courses) {
  // Enrollment trend data
  const enrollmentData = generateEnrollmentData(courses);
  if (enrollmentChart) enrollmentChart.destroy();
  enrollmentChart = new Chart(document.getElementById("enrollmentChart"), {
    type: "line",
    data: {
      labels: enrollmentData.labels,
      datasets: [
        {
          label: "Enrollments",
          data: enrollmentData.enrollments,
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y",
        },
        {
          label: "Revenue ($)",
          data: enrollmentData.revenue,
          borderColor: "#ffc107",
          backgroundColor: "rgba(255, 193, 7, 0.1)",
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
        y: { title: { display: true, text: "Enrollments" } },
        y1: {
          position: "right",
          title: { display: true, text: "Revenue ($)" },
        },
      },
    },
  });

  // Course distribution
  const distributionData = generateDistributionData(courses);
  if (courseDistributionChart) courseDistributionChart.destroy();
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
              "#dc3545",
              "#17a2b8",
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

  // Ratings chart
  if (ratingsChart) ratingsChart.destroy();
  ratingsChart = new Chart(document.getElementById("ratingsChart"), {
    type: "bar",
    data: {
      labels: courses.map((c) => c.title.substring(0, 20)),
      datasets: [
        {
          label: "Rating",
          data: courses.map((c) => c.rating || 0),
          backgroundColor: "#ffc107",
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
      },
      scales: {
        y: { max: 5, title: { display: true, text: "Rating (1-5)" } },
      },
    },
  });

  // Progress chart
  const progressData = generateProgressData(courses);
  if (progressChart) progressChart.destroy();
  progressChart = new Chart(document.getElementById("progressChart"), {
    type: "doughnut",
    data: {
      labels: ["Completed", "In Progress", "Not Started"],
      datasets: [
        {
          data: progressData,
          backgroundColor: ["#28a745", "#ffc107", "#dc3545"],
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

// Generate enrollment data
function generateEnrollmentData(courses) {
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
  const enrollments = months.map(() => Math.floor(Math.random() * 50) + 10);
  const revenue = enrollments.map((e) => e * (courses[0]?.price || 49.99));
  return { labels: months, enrollments, revenue };
}

// Generate distribution data
function generateDistributionData(courses) {
  const categories = {
    "Web Development": 0,
    Programming: 0,
    "Data Science": 0,
    Design: 0,
    Business: 0,
  };

  courses.forEach((course) => {
    if (course.title.includes("Web") || course.title.includes("HTML")) {
      categories["Web Development"] += course.students || 0;
    } else if (
      course.title.includes("Python") ||
      course.title.includes("JavaScript")
    ) {
      categories["Programming"] += course.students || 0;
    } else if (course.title.includes("Data")) {
      categories["Data Science"] += course.students || 0;
    } else if (course.title.includes("Design")) {
      categories["Design"] += course.students || 0;
    } else {
      categories["Business"] += course.students || 0;
    }
  });

  return {
    labels: Object.keys(categories),
    values: Object.values(categories),
  };
}

// Generate progress data
function generateProgressData(courses) {
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;

  courses.forEach((course) => {
    const progress = courseProgress[course.id];
    if (progress && course.curriculum) {
      const completedCount = progress.completedLessons?.length || 0;
      const totalLessons = course.curriculum.length;
      const percentage = (completedCount / totalLessons) * 100;

      if (percentage === 100) completed++;
      else if (percentage > 0) inProgress++;
      else notStarted++;
    } else {
      notStarted++;
    }
  });

  return [completed, inProgress, notStarted];
}

// Update course performance table
function updateCoursePerformance(courses) {
  let html = "";
  courses.forEach((course) => {
    const progress = courseProgress[course.id];
    let completionRate = 0;
    if (progress && course.curriculum) {
      const completedCount = progress.completedLessons?.length || 0;
      completionRate = (completedCount / course.curriculum.length) * 100;
    }

    const engagement = Math.floor(Math.random() * 40) + 60;

    html += `
                    <tr>
                        <td>${course.title}</td>
                        <td>${course.students || 0}</td>
                        <td>$${((course.price || 0) * (course.students || 0)).toLocaleString()}</td>
                        <td>
                            <div class="rating-stars">
                                ${generateStarRating(course.rating || 0)}
                            </div>
                            ${course.rating || 0}
                        </td>
                        <td>
                            <div class="progress">
                                <div class="progress-bar bg-success" style="width: ${completionRate}%"></div>
                            </div>
                            <small>${completionRate.toFixed(0)}%</small>
                        </td>
                        <td>
                            <div class="progress">
                                <div class="progress-bar bg-info" style="width: ${engagement}%"></div>
                            </div>
                            <small>${engagement}%</small>
                        </td>
                    </tr>
                `;
  });

  $("#coursePerformanceBody").html(html);
}

// Update student activity
function updateStudentActivity(courses) {
  // Get enrolled students from courses
  const enrolledStudents = [];
  courses.forEach((course) => {
    // Simulate enrolled students
    for (let i = 0; i < Math.min(course.students || 0, 10); i++) {
      const student = allStudents[i % allStudents.length];
      if (student && !enrolledStudents.find((s) => s.id === student.id)) {
        const progress = Math.floor(Math.random() * 100);
        enrolledStudents.push({
          ...student,
          courseTitle: course.title,
          progress: progress,
          lastActive: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
          ).toLocaleDateString(),
        });
      }
    }
  });

  let html = "";
  enrolledStudents.slice(0, 15).forEach((student) => {
    html += `
                    <div class="student-item">
                        <div class="d-flex align-items-center">
                            <img src="${student.avatar || "https://randomuser.me/api/portraits/men/1.jpg"}" 
                                 class="student-avatar" alt="${student.name}">
                            <div class="flex-grow-1">
                                <strong>${student.name}</strong>
                                <br>
                                <small class="text-muted">Course: ${student.courseTitle}</small>
                            </div>
                            <div class="text-end">
                                <div class="progress" style="width: 100px;">
                                    <div class="progress-bar bg-success" style="width: ${student.progress}%"></div>
                                </div>
                                <small>${student.progress}% complete</small>
                                <br>
                                <small class="text-muted">Last active: ${student.lastActive}</small>
                            </div>
                        </div>
                    </div>
                `;
  });

  $("#studentActivityList").html(
    html || '<p class="text-muted text-center">No student activity yet</p>',
  );
}

// Generate star rating
function generateStarRating(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += `<i class="fas fa-star${i <= rating ? "" : "-o"}"></i>`;
  }
  return stars;
}

// Export analytics
function exportAnalytics() {
  const report = {
    instructor: currentUser.name,
    generatedDate: new Date().toISOString(),
    courses: myCourses.map((course) => ({
      title: course.title,
      students: course.students,
      revenue: course.price * (course.students || 0),
      rating: course.rating,
    })),
  };

  const dataStr = JSON.stringify(report, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const exportFileDefaultName = `instructor_analytics_${new Date().toISOString().split("T")[0]}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();

  showToast("Success", "Analytics report exported!", "success");
}

// Export chart
function exportChart(chartName) {
  showToast("Info", "Chart export feature coming soon!", "info");
}

// Export course performance
function exportCoursePerformance() {
  let csv = "Course Name,Students,Revenue,Rating,Completion Rate,Engagement\n";
  $("#coursePerformanceBody tr").each(function () {
    const row = $(this);
    csv += '"' + row.find("td:eq(0)").text() + '",';
    csv += row.find("td:eq(1)").text() + ",";
    csv += row.find("td:eq(2)").text() + ",";
    csv += row.find("td:eq(3)").text().split("★").length - 1 + ",";
    csv += row.find("td:eq(4) small").text() + ",";
    csv += row.find("td:eq(5) small").text() + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "course_performance.csv";
  link.click();
  showToast("Success", "CSV exported successfully!", "success");
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

// Load instructor profile
function loadInstructorProfile() {
  if (currentUser) {
    $("#instructorWelcome").html(
      `<i class="fas fa-chalkboard-teacher"></i> Welcome, ${currentUser.name.split(" ")[0]}`,
    );
  }
}

// Logout
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "../../login.html";
}

// Event listeners
$(document).ready(function () {
  checkAuth();
  loadInstructorProfile();
  loadInstructorData();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
