let allCourses = [];
let enrolledCourses = [];
let currentUser = null;
let selectedCourseId = null;

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

// Load courses data
async function loadCourses() {
  try {
    const response = await fetch("../../data/courses.json");
    const data = await response.json();
    allCourses = data.courses;

    // Mark enrolled courses
    if (currentUser.enrolledCourses) {
      allCourses.forEach((course) => {
        course.enrolled = currentUser.enrolledCourses.includes(course.id);
      });
    }

    renderCourses();
    updateEnrollmentStats();
  } catch (error) {
    console.error("Error loading courses:", error);
    $("#coursesContainer").html(
      '<div class="alert alert-danger">Failed to load courses. Please try again.</div>',
    );
  }
}

// Render courses with filters
function renderCourses() {
  const searchTerm = $("#searchInput").val().toLowerCase();
  const levelFilter = $("#levelFilter").val();
  const sortBy = $("#sortBy").val();

  let filteredCourses = [...allCourses];

  // Apply search filter
  if (searchTerm) {
    filteredCourses = filteredCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.instructorName.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm),
    );
  }

  // Apply level filter
  if (levelFilter) {
    filteredCourses = filteredCourses.filter(
      (course) => course.level === levelFilter,
    );
  }

  // Apply sorting
  switch (sortBy) {
    case "price_low":
      filteredCourses.sort((a, b) => a.price - b.price);
      break;
    case "price_high":
      filteredCourses.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      filteredCourses.sort((a, b) => b.rating - a.rating);
      break;
    case "students":
      filteredCourses.sort((a, b) => b.students - a.students);
      break;
    default:
      // Keep original order
      break;
  }

  // Update filter chips
  updateFilterChips(searchTerm, levelFilter);

  // Show/hide no results
  if (filteredCourses.length === 0) {
    $("#coursesContainer").hide();
    $("#noResults").show();
    return;
  }

  $("#coursesContainer").show();
  $("#noResults").hide();

  // Render courses
  let html = '<div class="row">';
  filteredCourses.forEach((course) => {
    html += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card course-card h-100">
                            <div class="position-relative">
                                <img src="${escapeHtml(course.image)}" class="card-img-top course-image" alt="${escapeHtml(course.title)}">
                                <span class="badge bg-${getLevelColor(course.level)} badge-level">${escapeHtml(course.level)}</span>
                                ${course.enrolled ? '<span class="enrolled-badge"><i class="fas fa-check-circle"></i> Enrolled</span>' : ""}
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${escapeHtml(course.title)}</h5>
                                <p class="card-text text-muted small">
                                    <i class="fas fa-user"></i> ${escapeHtml(course.instructorName)}
                                </p>
                                <p class="card-text">${escapeHtml(course.description.substring(0, 100))}...</p>
                                <div class="mb-2">
                                    <span class="rating">
                                        ${generateStars(course.rating)}
                                    </span>
                                    <small class="text-muted">(${course.rating})</small>
                                </div>
                                <div class="mb-2">
                                    <small class="text-muted">
                                        <i class="fas fa-clock"></i> ${escapeHtml(course.duration)} |
                                        <i class="fas fa-users"></i> ${course.students} students
                                    </small>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mt-3">
                                    <span class="price">$${course.price}</span>
                                    ${
                                      course.enrolled
                                        ? `<a href="course-detail.html?id=${course.id}" class="btn btn-info btn-enroll">
                                            <i class="fas fa-play"></i> Continue Learning
                                        </a>`
                                        : `<button class="btn btn-primary btn-enroll" onclick="showEnrollModal(${course.id})">
                                            <i class="fas fa-shopping-cart"></i> Enroll Now
                                        </button>`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                `;
  });
  html += "</div>";

  $("#coursesContainer").html(html);
}

// Generate star rating
function generateStars(rating) {
  let stars = "";
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>';
  }
  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>';
  }
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>';
  }
  return stars;
}

// Get level color
function getLevelColor(level) {
  switch (level) {
    case "Beginner":
      return "success";
    case "Intermediate":
      return "warning";
    case "Advanced":
      return "danger";
    default:
      return "secondary";
  }
}

// Update filter chips
function updateFilterChips(searchTerm, levelFilter) {
  let chips = "";
  if (searchTerm) {
    chips += `<span class="badge bg-secondary me-1">Search: ${escapeHtml(searchTerm)} <i class="fas fa-times" style="cursor:pointer" onclick="clearSearch()"></i></span>`;
  }
  if (levelFilter) {
    chips += `<span class="badge bg-secondary me-1">Level: ${escapeHtml(levelFilter)} <i class="fas fa-times" style="cursor:pointer" onclick="clearLevel()"></i></span>`;
  }
  $("#filterChips").html(
    chips || '<span class="text-muted">No filters applied</span>',
  );
}

// Clear filters
function clearSearch() {
  $("#searchInput").val("");
  renderCourses();
}

function clearLevel() {
  $("#levelFilter").val("");
  renderCourses();
}

// Show enroll modal
function showEnrollModal(courseId) {
  const course = allCourses.find((c) => c.id === courseId);
  if (course) {
    selectedCourseId = courseId;
    $("#modalCourseTitle").text(course.title);
    $("#modalCoursePrice").text("$" + course.price);
    $("#enrollModal").modal("show");
  }
}

// Enroll in course
function enrollInCourse() {
  const course = allCourses.find((c) => c.id === selectedCourseId);
  if (!course) return;

  // Check if already enrolled
  if (currentUser.enrolledCourses.includes(selectedCourseId)) {
    showToast(
      "Already Enrolled",
      "You are already enrolled in this course!",
      "warning",
    );
    $("#enrollModal").modal("hide");
    return;
  }

  // Update local user data
  currentUser.enrolledCourses.push(selectedCourseId);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // Update course enrolled status
  course.enrolled = true;
  course.students++;

  // Update allCourses
  const index = allCourses.findIndex((c) => c.id === selectedCourseId);
  if (index !== -1) {
    allCourses[index] = course;
  }

  // Re-render
  renderCourses();
  updateEnrollmentStats();

  // Show success message
  showToast(
    "Success!",
    `You have successfully enrolled in ${escapeHtml(course.title)}`,
    "success",
  );

  // Close modal
  $("#enrollModal").modal("hide");

  // Update users.json (simulate by updating localStorage)
  updateUserData();
}

// Update user data in localStorage
function updateUserData() {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (users.users) {
    const userIndex = users.users.findIndex((u) => u.id === currentUser.id);
    if (userIndex !== -1) {
      users.users[userIndex] = currentUser;
      localStorage.setItem("users", JSON.stringify(users));
    }
  }
}

// Update enrollment statistics
function updateEnrollmentStats() {
  const enrolledCount = currentUser.enrolledCourses?.length || 0;
  let totalSpent = 0;

  allCourses.forEach((course) => {
    if (currentUser.enrolledCourses?.includes(course.id)) {
      totalSpent += course.price;
    }
  });

  const completedCourses = currentUser.enrolledCourses?.filter(id => {
    const p = localStorage.getItem(`course_progress_${currentUser.id}_${id}`);
    if (p) { try { const d = JSON.parse(p); return d.completedLessons?.length > 0; } catch(e) {} }
    return false;
  }).length || 0;
  const completionRate = enrolledCount > 0 ? Math.round((completedCourses / enrolledCount) * 100) : 0;
  $("#enrollmentStats").html(`
                <div><i class="fas fa-graduation-cap"></i> Enrolled: <strong>${enrolledCount}</strong></div>
                <div class="mt-2"><i class="fas fa-dollar-sign"></i> Total Spent: <strong>$${totalSpent.toFixed(2)}</strong></div>
                <div class="mt-2"><i class="fas fa-trophy"></i> Completion Rate: <strong>${completionRate}%</strong></div>
            `);
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
                <div class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="true" data-bs-delay="3000">
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

// Load user profile
function loadUserProfile() {
  if (currentUser) {
    $("#userWelcome").html(
      `<i class="fas fa-user-circle"></i> Welcome, ${escapeHtml(currentUser.name)}`,
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
  loadCourses();

  // Search input debounce
  let searchTimeout;
  $("#searchInput").on("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => renderCourses(), 300);
  });

  $("#levelFilter").on("change", () => renderCourses());
  $("#sortBy").on("change", () => renderCourses());
  $("#confirmEnrollBtn").on("click", enrollInCourse);
  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
