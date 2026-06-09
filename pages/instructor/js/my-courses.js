let currentUser = null;
let myCourses = [];
let filteredCourses = [];
let currentPage = 1;
let itemsPerPage = 6;
let deleteId = null;
let lessons = [
  "Introduction",
  "Getting Started",
  "Core Concepts",
  "Practical Examples",
  "Final Project",
];

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

// Load courses
async function loadCourses() {
  try {
    const response = await fetch("../../data/courses.json");
    const data = await response.json();
    myCourses = data.courses.filter((c) => c.instructorId === currentUser.id);

    // Load saved courses from localStorage
    loadSavedCourses();

    updateStats();
    filterAndRender();
  } catch (error) {
    console.error("Error loading courses:", error);
    showToast("Error", "Failed to load courses", "danger");
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

// Save courses to localStorage
function saveCourses() {
  localStorage.setItem(
    `instructor_courses_${currentUser.id}`,
    JSON.stringify(myCourses),
  );
}

// Update statistics
function updateStats() {
  $("#totalCourses").text(myCourses.length);

  let totalStudents = 0;
  let totalRevenue = 0;
  myCourses.forEach((course) => {
    totalStudents += course.students || 0;
    totalRevenue += course.price * (course.students || 0);
  });
  $("#totalStudents").text(totalStudents);
  $("#totalRevenue").text("$" + totalRevenue.toLocaleString());
}

// Filter and render courses
function filterAndRender() {
  const searchTerm = $("#searchCourse").val().toLowerCase();
  const levelFilter = $("#levelFilter").val();
  const sortBy = $("#sortBy").val();

  filteredCourses = [...myCourses];

  // Apply search filter
  if (searchTerm) {
    filteredCourses = filteredCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm),
    );
  }

  // Apply level filter
  if (levelFilter !== "all") {
    filteredCourses = filteredCourses.filter(
      (course) => course.level === levelFilter,
    );
  }

  // Apply sorting
  switch (sortBy) {
    case "title":
      filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "students":
      filteredCourses.sort((a, b) => (b.students || 0) - (a.students || 0));
      break;
    case "revenue":
      filteredCourses.sort(
        (a, b) => b.price * (b.students || 0) - a.price * (a.students || 0),
      );
      break;
  }

  currentPage = 1;
  renderCourses();
  renderPagination();
}

// Render courses
function renderCourses() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageCourses = filteredCourses.slice(start, end);

  if (pageCourses.length === 0) {
    $("#coursesContainer").html(`
                    <div class="empty-state">
                        <i class="fas fa-book"></i>
                        <h4>No Courses Found</h4>
                        <p>Create your first course to get started!</p>
                        <button class="btn btn-success" onclick="showCreateModal()">
                            <i class="fas fa-plus"></i> Create Course
                        </button>
                    </div>
                `);
    return;
  }

  let html = '<div class="row">';
  pageCourses.forEach((course) => {
    const revenue = (course.price * (course.students || 0)).toLocaleString();

    html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="course-card">
                            <div class="position-relative">
                                <img src="${escapeHtml(course.image)}" class="course-image" alt="${escapeHtml(course.title)}" onerror="this.src='https://picsum.photos/id/100/300/200'">
                                <span class="badge bg-${getLevelColor(course.level)} badge-level">${escapeHtml(course.level)}</span>
                            </div>
                            <div class="course-body">
                                <h5 class="course-title">${escapeHtml(course.title)}</h5>
                                <div class="rating-stars mb-2">
                                    ${generateStars(course.rating || 0)}
                                    <span class="text-muted">(${course.rating || 0})</span>
                                </div>
                                <div class="course-stats">
                                    <div class="stat">
                                        <div class="stat-value">${course.students || 0}</div>
                                        <small>Students</small>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-value">${course.duration}</div>
                                        <small>Duration</small>
                                    </div>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mt-2">
                                    <div>
                                        <span class="course-price">$${course.price}</span>
                                        <br>
                                        <small class="text-muted">Revenue: $${revenue}</small>
                                    </div>
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-outline-primary" onclick="editCourse(${course.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="showDeleteModal(${course.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-success w-100 mt-2" onclick="viewCourseDetails(${course.id})">
                                    <i class="fas fa-eye"></i> View Details
                                </button>
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
  for (let i = 1; i <= 5; i++) {
    stars += `<i class="${i <= rating ? "fas" : "far"} fa-star"></i>`;
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

// Render pagination
function renderPagination() {
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  if (totalPages <= 1) {
    $("#pagination").html("");
    return;
  }

  let html = "";
  html += `<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
                    </li>`;

  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    html += `<li class="page-item ${currentPage === i ? "active" : ""}">
                            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                         </li>`;
  }

  if (totalPages > 5) {
    html += `<li class="page-item disabled"><a class="page-link">...</a></li>`;
    html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a></li>`;
  }

  html += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
                        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
                    </li>`;

  $("#pagination").html(html);
}

// Change page
function changePage(page) {
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderCourses();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Show create modal
function showCreateModal() {
  $("#modalTitle").text("Create New Course");
  $("#courseForm")[0].reset();
  $("#courseId").remove();
  lessons = [
    "Introduction",
    "Getting Started",
    "Core Concepts",
    "Practical Examples",
    "Final Project",
  ];
  renderCurriculum();
  $("#courseModal").modal("show");
}

// Edit course
function editCourse(id) {
  const course = myCourses.find((c) => c.id === id);
  if (course) {
    $("#modalTitle").text("Edit Course");

    if ($("#courseId").length === 0) {
      $("<input>")
        .attr({ type: "hidden", id: "courseId", value: course.id })
        .appendTo("#courseForm");
    } else {
      $("#courseId").val(course.id);
    }

    $("#courseTitle").val(course.title);
    $("#courseDescription").val(course.description);
    $("#courseLevel").val(course.level);
    $("#coursePrice").val(course.price);
    $("#courseDuration").val(course.duration);
    $("#courseImage").val(course.image);

    lessons = course.curriculum || [
      "Introduction",
      "Getting Started",
      "Core Concepts",
      "Practical Examples",
      "Final Project",
    ];
    renderCurriculum();

    $("#courseModal").modal("show");
  }
}

// Render curriculum list
function renderCurriculum() {
  let html = "";
  lessons.forEach((lesson, index) => {
    html += `
                    <div class="curriculum-item">
                        <span><strong>Lesson ${index + 1}:</strong> ${escapeHtml(lesson)}</span>
                        <div>
                            <i class="fas fa-edit text-primary me-2" style="cursor:pointer" onclick="editLesson(${index})"></i>
                            <i class="fas fa-trash text-danger" style="cursor:pointer" onclick="removeLesson(${index})"></i>
                        </div>
                    </div>
                `;
  });
  $("#curriculumList").html(html);
}

// Add lesson
function addLesson() {
  const lessonName = prompt("Enter lesson name:");
  if (lessonName) {
    lessons.push(lessonName);
    renderCurriculum();
  }
}

// Edit lesson
function editLesson(index) {
  const newName = prompt("Edit lesson name:", lessons[index]);
  if (newName) {
    lessons[index] = newName;
    renderCurriculum();
  }
}

// Remove lesson
function removeLesson(index) {
  if (confirm("Remove this lesson?")) {
    lessons.splice(index, 1);
    renderCurriculum();
  }
}

// Save course
function saveCourse() {
  const title = $("#courseTitle").val();
  const description = $("#courseDescription").val();
  const level = $("#courseLevel").val();
  const price = parseFloat($("#coursePrice").val());
  const duration = $("#courseDuration").val();
  const image =
    $("#courseImage").val() || "https://picsum.photos/id/100/300/200";

  if (!title || !description || !price || !duration) {
    showToast("Error", "Please fill all required fields", "danger");
    return;
  }

  const courseId = $("#courseId").val();

  if (courseId) {
    // Update existing course
    const index = myCourses.findIndex((c) => c.id === parseInt(courseId));
    if (index !== -1) {
      myCourses[index] = {
        ...myCourses[index],
        title,
        description,
        level,
        price,
        duration,
        image,
        curriculum: lessons,
        updatedDate: new Date().toISOString(),
      };
      showToast("Success", "Course updated successfully!", "success");
    }
  } else {
    // Create new course
    const newCourse = {
      id: Date.now(),
      title,
      description,
      instructorId: currentUser.id,
      instructorName: currentUser.name,
      level,
      price,
      duration,
      image,
      curriculum: lessons,
      students: 0,
      rating: 0,
      createdDate: new Date().toISOString(),
    };
    myCourses.push(newCourse);
    showToast("Success", "Course created successfully!", "success");
  }

  saveCourses();
  updateStats();
  filterAndRender();
  $("#courseModal").modal("hide");
}

// View course details
function viewCourseDetails(id) {
  window.location.href = `course-detail.html?id=${id}`;
}

// Show delete modal
function showDeleteModal(id) {
  deleteId = id;
  $("#deleteModal").modal("show");
}

// Confirm delete
function confirmDelete() {
  myCourses = myCourses.filter((c) => c.id !== deleteId);
  saveCourses();
  updateStats();
  filterAndRender();
  $("#deleteModal").modal("hide");
  showToast("Deleted", "Course has been deleted", "success");
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
  loadCourses();

  $("#searchCourse").on("input", function () {
    filterAndRender();
  });

  $("#levelFilter, #sortBy").on("change", function () {
    filterAndRender();
  });

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
