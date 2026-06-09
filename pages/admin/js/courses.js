let currentUser = null;
let allCourses = [];
let allInstructors = [];
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
  if (currentUser.role !== "admin") {
    window.location.href = `../../pages/${currentUser.role}/dashboard.html`;
    return null;
  }
  return currentUser;
}

// Load all data
async function loadData() {
  try {
    // Load courses
    const coursesResponse = await fetch("../../data/courses.json");
    const coursesData = await coursesResponse.json();
    allCourses = coursesData.courses;

    // Load users to get instructors
    const usersResponse = await fetch("../../data/users.json");
    const usersData = await usersResponse.json();
    allInstructors = usersData.users.filter((u) => u.role === "instructor");

    // Load saved courses from localStorage
    loadSavedCourses();

    filterAndRender();
    populateInstructors();
  } catch (error) {
    console.error("Error loading data:", error);
    showToast("Error", "Failed to load data", "danger");
  }
}

// Load saved courses from localStorage
function loadSavedCourses() {
  const saved = localStorage.getItem("admin_courses");
  if (saved) {
    const savedCourses = JSON.parse(saved);
    savedCourses.forEach((savedCourse) => {
      if (!allCourses.find((c) => c.id === savedCourse.id)) {
        allCourses.push(savedCourse);
      }
    });
  }
}

// Save courses to localStorage
function saveCourses() {
  localStorage.setItem("admin_courses", JSON.stringify(allCourses));
}

// Populate instructors dropdown
function populateInstructors() {
  let options = '<option value="">Select Instructor</option>';
  allInstructors.forEach((instructor) => {
    options += `<option value="${instructor.id}">${instructor.name} (${instructor.email})</option>`;
  });
  $("#courseInstructor").html(options);
}

// Filter and render courses
function filterAndRender() {
  const searchTerm = $("#searchCourse").val().toLowerCase();
  const levelFilter = $("#levelFilter").val();
  const sortBy = $("#sortBy").val();

  filteredCourses = [...allCourses];

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
      filteredCourses.sort((a, b) => b.students - a.students);
      break;
    case "price_asc":
      filteredCourses.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      filteredCourses.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      filteredCourses.sort((a, b) => b.rating - a.rating);
      break;
  }

  updateTotalCount();
  renderCourses();
  renderPagination();
}

// Update total count
function updateTotalCount() {
  $("#totalCoursesCount").text(filteredCourses.length);
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
                        <button class="btn btn-primary" onclick="showCreateModal()">
                            <i class="fas fa-plus"></i> Create Course
                        </button>
                    </div>
                `);
    return;
  }

  let html = '<div class="row">';
  pageCourses.forEach((course) => {
    html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="course-card">
                            <div class="position-relative">
                                <img src="${escapeHtml(course.image)}" class="course-image" alt="${escapeHtml(course.title)}" onerror="this.src='https://picsum.photos/id/100/300/200'">
                                <span class="badge bg-${getLevelColor(course.level)} badge-level">${escapeHtml(course.level)}</span>
                            </div>
                            <div class="course-body">
                                <h5 class="course-title">${escapeHtml(course.title)}</h5>
                                <div class="course-instructor">
                                    <i class="fas fa-user"></i> ${escapeHtml(course.instructorName)}
                                </div>
                                <div class="rating-stars mb-2">
                                    ${generateStars(course.rating)}
                                    <span class="text-muted">(${course.rating})</span>
                                </div>
                                <div class="course-stats">
                                    <div class="stat">
                                        <div class="stat-value">${course.students}</div>
                                        <small>Students</small>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-value">${escapeHtml(course.duration)}</div>
                                        <small>Duration</small>
                                    </div>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mt-2">
                                    <span class="course-price">$${course.price}</span>
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-outline-primary" onclick="editCourse(${course.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="showDeleteModal(${course.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
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
  const course = allCourses.find((c) => c.id === id);
  if (course) {
    $("#modalTitle").text("Edit Course");

    // Add hidden ID field
    if ($("#courseId").length === 0) {
      $("<input>")
        .attr({
          type: "hidden",
          id: "courseId",
          value: course.id,
        })
        .appendTo("#courseForm");
    } else {
      $("#courseId").val(course.id);
    }

    $("#courseTitle").val(course.title);
    $("#courseDescription").val(course.description);
    $("#courseInstructor").val(course.instructorId);
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
  const instructorId = parseInt($("#courseInstructor").val());
  const level = $("#courseLevel").val();
  const price = parseFloat($("#coursePrice").val());
  const duration = $("#courseDuration").val();
  const image =
    $("#courseImage").val() || "https://picsum.photos/id/100/300/200";

  if (!title || !description || !instructorId || !price || !duration) {
    showToast("Error", "Please fill all required fields", "danger");
    return;
  }

  const instructor = allInstructors.find((i) => i.id === instructorId);
  const courseId = $("#courseId").val();

  if (courseId) {
    // Update existing course
    const index = allCourses.findIndex((c) => c.id === parseInt(courseId));
    if (index !== -1) {
      allCourses[index] = {
        ...allCourses[index],
        title,
        description,
        instructorId,
        instructorName: instructor.name,
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
      instructorId,
      instructorName: instructor.name,
      level,
      price,
      duration,
      image,
      curriculum: lessons,
      students: 0,
      rating: 0,
      enrolled: false,
      createdDate: new Date().toISOString(),
    };
    allCourses.push(newCourse);
    showToast("Success", "Course created successfully!", "success");
  }

  saveCourses();
  filterAndRender();
  $("#courseModal").modal("hide");
}

// Show delete modal
function showDeleteModal(id) {
  deleteId = id;
  $("#deleteModal").modal("show");
}

// Confirm delete
function confirmDelete() {
  allCourses = allCourses.filter((c) => c.id !== deleteId);
  saveCourses();
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

// Load admin profile
function loadAdminProfile() {
  if (currentUser) {
    $("#adminWelcome").html(
      `<i class="fas fa-user-shield"></i> ${currentUser.name}`,
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
  loadAdminProfile();
  loadData();

  $("#searchCourse").on("input", function () {
    currentPage = 1;
    filterAndRender();
  });

  $("#levelFilter, #sortBy").on("change", function () {
    currentPage = 1;
    filterAndRender();
  });

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
