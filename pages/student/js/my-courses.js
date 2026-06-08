let currentUser = null;
let myCourses = [];
let allCourses = [];
let courseProgress = {};

// Check authentication
function checkAuth() {
  const user = localStorage.getItem("currentUser");
  if (!user) {
    window.location.href = "../../login.html";
    return null;
  }
  currentUser = JSON.parse(user);
  if (currentUser.role !== "student") {
    window.location.href = `../../pages/${currentUser.role}/dashboard.html`;
    return null;
  }
  return currentUser;
}

// Load data
async function loadData() {
  try {
    // Load courses
    const coursesResponse = await fetch("../../assets/data/courses.json");
    const coursesData = await coursesResponse.json();
    allCourses = coursesData.courses;

    // Load progress from localStorage or initialize
    const savedProgress = localStorage.getItem(
      `courseProgress_${currentUser.id}`,
    );
    if (savedProgress) {
      courseProgress = JSON.parse(savedProgress);
    } else {
      // Initialize progress for enrolled courses
      courseProgress = {};
      currentUser.enrolledCourses.forEach((courseId) => {
        courseProgress[courseId] = {
          progress: Math.floor(Math.random() * 100),
          lastAccessed: new Date().toISOString(),
          completed: Math.random() > 0.7,
        };
      });
      saveProgress();
    }

    // Filter my enrolled courses
    myCourses = allCourses
      .filter((course) => currentUser.enrolledCourses.includes(course.id))
      .map((course) => ({
        ...course,
        progress: courseProgress[course.id]?.progress || 0,
        completed: courseProgress[course.id]?.completed || false,
        lastAccessed: courseProgress[course.id]?.lastAccessed,
      }));

    updateStats();
    renderAllCourses();
    renderProgressCourses();
    renderCompletedCourses();
    renderRecentCourses();
  } catch (error) {
    console.error("Error loading data:", error);
    showToast("Error", "Failed to load your courses", "danger");
  }
}

// Save progress
function saveProgress() {
  localStorage.setItem(
    `courseProgress_${currentUser.id}`,
    JSON.stringify(courseProgress),
  );
}

// Update progress for a course
function updateProgress(courseId, newProgress) {
  if (courseProgress[courseId]) {
    courseProgress[courseId].progress = newProgress;
    courseProgress[courseId].completed = newProgress >= 100;
    if (newProgress >= 100) {
      courseProgress[courseId].completedDate = new Date().toISOString();
      showToast("Congratulations!", "Course completed! 🎉", "success");
    }
    saveProgress();

    // Update local course data
    const course = myCourses.find((c) => c.id === courseId);
    if (course) {
      course.progress = newProgress;
      course.completed = newProgress >= 100;
    }

    updateStats();
    renderAllCourses();
    renderProgressCourses();
    renderCompletedCourses();
    renderRecentCourses();
  }
}

// Update statistics
function updateStats() {
  const total = myCourses.length;
  const completed = myCourses.filter((c) => c.completed).length;
  const inProgress = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  $("#totalCourses").text(total);
  $("#completedCourses").text(completed);
  $("#inProgressCourses").text(inProgress);
  $("#completionRate").text(completionRate);
}

// Render all courses with search and sort
function renderAllCourses() {
  let filteredCourses = [...myCourses];

  // Apply search
  const searchTerm = $("#searchInput").val().toLowerCase();
  if (searchTerm) {
    filteredCourses = filteredCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.instructorName.toLowerCase().includes(searchTerm),
    );
  }

  // Apply sort
  const sortBy = $("#sortSelect").val();
  switch (sortBy) {
    case "recent":
      filteredCourses.sort(
        (a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed),
      );
      break;
    case "progress":
      filteredCourses.sort((a, b) => b.progress - a.progress);
      break;
    case "title":
      filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }

  if (filteredCourses.length === 0) {
    $("#allCoursesContainer").html(`
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <h4>No courses found</h4>
                        <p>You haven't enrolled in any courses yet or no matches found.</p>
                        <a href="courses.html" class="btn btn-primary">Browse Courses</a>
                    </div>
                `);
    return;
  }

  let html = '<div class="row">';
  filteredCourses.forEach((course) => {
    html += generateCourseCard(course);
  });
  html += "</div>";

  $("#allCoursesContainer").html(html);
}

// Render in-progress courses
function renderProgressCourses() {
  const progressCourses = myCourses.filter(
    (c) => !c.completed && c.progress > 0,
  );

  if (progressCourses.length === 0) {
    $("#progressCoursesContainer").html(`
                    <div class="empty-state">
                        <i class="fas fa-spinner"></i>
                        <h4>No courses in progress</h4>
                        <p>Start learning a course to see it here!</p>
                        <a href="courses.html" class="btn btn-primary">Browse Courses</a>
                    </div>
                `);
    return;
  }

  let html = '<div class="row">';
  progressCourses.forEach((course) => {
    html += generateCourseCard(course);
  });
  html += "</div>";

  $("#progressCoursesContainer").html(html);
}

// Render completed courses
function renderCompletedCourses() {
  const completedCourses = myCourses.filter((c) => c.completed);

  if (completedCourses.length === 0) {
    $("#completedCoursesContainer").html(`
                    <div class="empty-state">
                        <i class="fas fa-trophy"></i>
                        <h4>No completed courses yet</h4>
                        <p>Complete your first course to earn a certificate!</p>
                    </div>
                `);
    return;
  }

  let html = '<div class="row">';
  completedCourses.forEach((course) => {
    html += generateCourseCard(course);
  });
  html += "</div>";

  $("#completedCoursesContainer").html(html);
}

// Render recent courses (last 30 days)
function renderRecentCourses() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCourses = myCourses
    .filter((course) => new Date(course.lastAccessed) > thirtyDaysAgo)
    .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));

  if (recentCourses.length === 0) {
    $("#recentCoursesContainer").html(`
                    <div class="empty-state">
                        <i class="fas fa-clock"></i>
                        <h4>No recently accessed courses</h4>
                        <p>Access your courses to see them here!</p>
                    </div>
                `);
    return;
  }

  let html = '<div class="row">';
  recentCourses.forEach((course) => {
    html += generateCourseCard(course);
  });
  html += "</div>";

  $("#recentCoursesContainer").html(html);
}

// Generate course card HTML
function generateCourseCard(course) {
  const progressPercent = course.progress;
  const statusColor =
    progressPercent >= 100
      ? "success"
      : progressPercent > 0
        ? "info"
        : "secondary";
  const statusText =
    progressPercent >= 100
      ? "Completed"
      : progressPercent > 0
        ? "In Progress"
        : "Not Started";

  return `
                <div class="col-md-6 col-lg-4">
                    <div class="card course-card h-100">
                        <div class="position-relative">
                            <img src="${course.image}" class="card-img-top course-image" alt="${course.title}">
                            <span class="badge bg-${statusColor} badge-status">${statusText}</span>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${course.title}</h5>
                            <p class="card-text text-muted small">
                                <i class="fas fa-user"></i> ${course.instructorName}
                            </p>
                            <div class="mb-2">
                                <div class="d-flex justify-content-between">
                                    <small>Progress</small>
                                    <small>${progressPercent}%</small>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-${statusColor}" role="progressbar" 
                                         style="width: ${progressPercent}%" 
                                         aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-2">
                                <small class="text-muted">
                                    <i class="fas fa-clock"></i> Last accessed: ${formatDate(course.lastAccessed)}
                                </small>
                            </div>
                            <div class="d-flex gap-2 mt-3">
                                <button class="btn btn-primary btn-sm flex-grow-1" onclick="showCourseDetail(${course.id})">
                                    <i class="fas fa-play"></i> Continue
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="showCourseModal(${course.id})">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
}

// Show course modal
function showCourseModal(courseId) {
  const course = myCourses.find((c) => c.id === courseId);
  if (!course) return;

  const nextLesson = getNextLesson(course);

  $("#modalCourseTitle").text(course.title);
  $("#modalCourseContent").html(`
                <div class="row">
                    <div class="col-md-4">
                        <img src="${course.image}" class="img-fluid rounded" alt="${course.title}">
                    </div>
                    <div class="col-md-8">
                        <h6>Course Information</h6>
                        <p><strong>Instructor:</strong> ${course.instructorName}</p>
                        <p><strong>Duration:</strong> ${course.duration}</p>
                        <p><strong>Level:</strong> ${course.level}</p>
                        <p><strong>Progress:</strong> ${course.progress}%</p>
                        <div class="progress mb-3">
                            <div class="progress-bar" style="width: ${course.progress}%"></div>
                        </div>
                        <h6>Description</h6>
                        <p>${course.description}</p>
                        <h6>Next Lesson</h6>
                        <p>${nextLesson}</p>
                    </div>
                </div>
            `);
  $("#continueLearningBtn").attr("href", `course-detail.html?id=${course.id}`);
  $("#courseModal").modal("show");
}

// Show course detail page
function showCourseDetail(courseId) {
  window.location.href = `course-detail.html?id=${courseId}`;
}

// Get next lesson based on progress
function getNextLesson(course) {
  const lessons = course.curriculum || [
    "Introduction",
    "Chapter 1",
    "Chapter 2",
    "Chapter 3",
    "Final Project",
  ];
  const progressIndex = Math.floor((course.progress / 100) * lessons.length);
  const nextIndex = Math.min(progressIndex, lessons.length - 1);
  return lessons[nextIndex] || "Getting Started";
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
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

// Load user profile
function loadUserProfile() {
  if (currentUser) {
    $("#userWelcome").html(
      `<i class="fas fa-user-circle"></i> Welcome back, ${currentUser.name.split(" ")[0]}!`,
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
  loadUserProfile();
  loadData();

  // Search and filter events
  let searchTimeout;
  $("#searchInput").on("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => renderAllCourses(), 300);
  });

  $("#sortSelect").on("change", () => renderAllCourses());

  // Tab change event to re-render
  $("#courseTabs button").on("shown.bs.tab", function (e) {
    const target = $(e.target).attr("data-bs-target");
    if (target === "#all") renderAllCourses();
    else if (target === "#progress") renderProgressCourses();
    else if (target === "#completed") renderCompletedCourses();
    else if (target === "#recent") renderRecentCourses();
  });

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });

  // Demo: Simulate progress update (can be removed in production)
  setTimeout(() => {
    if (myCourses.length > 0 && !myCourses[0].completed) {
      // This is just for demo - in real app, progress would update from course detail page
      console.log(
        "Tip: Progress updates automatically as you complete lessons",
      );
    }
  }, 1000);
});
