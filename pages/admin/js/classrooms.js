let currentUser = null;
let allClassrooms = [];
let allCourses = [];
let allUsers = [];
let filteredClassrooms = [];
let currentPage = 1;
let itemsPerPage = 6;
let deleteId = null;

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
    // Load classrooms
    const classroomsResponse = await fetch("../../data/classrooms.json");
    const classroomsData = await classroomsResponse.json();
    allClassrooms = classroomsData.classrooms;

    // Load courses
    const coursesResponse = await fetch("../../data/courses.json");
    const coursesData = await coursesResponse.json();
    allCourses = coursesData.courses;

    // Load users
    const usersResponse = await fetch("../../data/users.json");
    const usersData = await usersResponse.json();
    allUsers = usersData.users;

    // Load saved classrooms from localStorage
    loadSavedClassrooms();

    filterAndRender();
  } catch (error) {
    console.error("Error loading data:", error);
    showToast("Error", "Failed to load data", "danger");
  }
}

// Load saved classrooms from localStorage
function loadSavedClassrooms() {
  const saved = localStorage.getItem("admin_classrooms");
  if (saved) {
    const savedClassrooms = JSON.parse(saved);
    // Merge saved classrooms with existing ones
    savedClassrooms.forEach((savedClass) => {
      if (!allClassrooms.find((c) => c.id === savedClass.id)) {
        allClassrooms.push(savedClass);
      }
    });
  }
}

// Save classrooms to localStorage
function saveClassrooms() {
  localStorage.setItem("admin_classrooms", JSON.stringify(allClassrooms));
}

// Filter and render classrooms
function filterAndRender() {
  const searchTerm = $("#searchClassroom").val().toLowerCase();
  const statusFilter = $("#statusFilter").val();
  const sortBy = $("#sortBy").val();

  filteredClassrooms = [...allClassrooms];

  // Apply search filter
  if (searchTerm) {
    filteredClassrooms = filteredClassrooms.filter((classroom) => {
      const course = allCourses.find((c) => c.id === classroom.courseId);
      return (
        classroom.name.toLowerCase().includes(searchTerm) ||
        (course && course.title.toLowerCase().includes(searchTerm))
      );
    });
  }

  // Apply status filter
  if (statusFilter !== "all") {
    filteredClassrooms = filteredClassrooms.filter((classroom) =>
      statusFilter === "active"
        ? classroom.active !== false
        : classroom.active === false,
    );
  }

  // Apply sorting
  switch (sortBy) {
    case "name":
      filteredClassrooms.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "students":
      filteredClassrooms.sort(
        (a, b) => (b.students?.length || 0) - (a.students?.length || 0),
      );
      break;
    case "created":
      filteredClassrooms.sort(
        (a, b) => new Date(b.createdDate) - new Date(a.createdDate),
      );
      break;
  }

  updateTotalCount();
  renderClassrooms();
  renderPagination();
}

// Update total count
function updateTotalCount() {
  $("#totalClassroomsCount").text(filteredClassrooms.length);
}

// Render classrooms
function renderClassrooms() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageClassrooms = filteredClassrooms.slice(start, end);

  if (pageClassrooms.length === 0) {
    $("#classroomsContainer").html(`
                    <div class="empty-state">
                        <i class="fas fa-chalkboard"></i>
                        <h4>No Classrooms Found</h4>
                        <p>Create your first classroom to get started!</p>
                        <button class="btn btn-primary" onclick="showCreateModal()">
                            <i class="fas fa-plus"></i> Create Classroom
                        </button>
                    </div>
                `);
    return;
  }

  let html = '<div class="row">';
  pageClassrooms.forEach((classroom) => {
    const course = allCourses.find((c) => c.id === classroom.courseId);
    const instructor = allUsers.find((u) => u.id === classroom.instructorId);
    const studentCount = classroom.students?.length || 0;
    const assignmentCount = classroom.assignments?.length || 0;
    const isActive = classroom.active !== false;

    html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="classroom-card">
                            <div class="classroom-header">
                                <div class="classroom-icon">
                                    <i class="fas fa-chalkboard-teacher"></i>
                                </div>
                                <div class="classroom-title">${escapeHtml(classroom.name)}</div>
                                <div class="small">${course?.title || "No Course Assigned"}</div>
                                <div class="badge-status ${isActive ? "bg-success" : "bg-secondary"}">
                                    ${isActive ? "Active" : "Inactive"}
                                </div>
                            </div>
                            <div class="classroom-stats">
                                <div class="stat-item">
                                    <div class="stat-number">${studentCount}</div>
                                    <div class="stat-label">Students</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number">${assignmentCount}</div>
                                    <div class="stat-label">Assignments</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number">${instructor?.name?.split(" ")[0] || "N/A"}</div>
                                    <div class="stat-label">Instructor</div>
                                </div>
                            </div>
                            <div class="classroom-body">
                                <p class="small text-muted mb-0">
                                    ${escapeHtml(classroom.description) || "No description provided"}
                                </p>
                            </div>
                            <div class="classroom-actions">
                                <div class="btn-group w-100" role="group">
                                    <button class="btn btn-sm btn-outline-primary" onclick="viewClassroom(${classroom.id})">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    <button class="btn btn-sm btn-outline-success" onclick="editClassroom(${classroom.id})">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="showDeleteModal(${classroom.id})">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
  });
  html += "</div>";

  $("#classroomsContainer").html(html);
}

// Render pagination
function renderPagination() {
  const totalPages = Math.ceil(filteredClassrooms.length / itemsPerPage);
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
  const totalPages = Math.ceil(filteredClassrooms.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderClassrooms();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Show create modal
function showCreateModal() {
  $("#modalTitle").text("Create New Classroom");
  $("#classroomForm")[0].reset();
  $("#classroomId").remove();
  populateDropdowns();
  $("#classroomModal").modal("show");
}

// Edit classroom
function editClassroom(id) {
  const classroom = allClassrooms.find((c) => c.id === id);
  if (classroom) {
    $("#modalTitle").text("Edit Classroom");
    populateDropdowns(classroom);

    // Add hidden ID field
    if ($("#classroomId").length === 0) {
      $("<input>")
        .attr({
          type: "hidden",
          id: "classroomId",
          value: classroom.id,
        })
        .appendTo("#classroomForm");
    } else {
      $("#classroomId").val(classroom.id);
    }

    $("#className").val(classroom.name);
    $("#classDescription").val(classroom.description || "");
    $("#classCourse").val(classroom.courseId);
    $("#classInstructor").val(classroom.instructorId);
    $("#startDate").val(classroom.startDate || "");
    $("#endDate").val(classroom.endDate || "");
    $("#isActive").prop("checked", classroom.active !== false);

    // Select students
    if (classroom.students) {
      $("#classStudents option").each(function () {
        if (classroom.students.includes(parseInt($(this).val()))) {
          $(this).prop("selected", true);
        }
      });
    }

    $("#classroomModal").modal("show");
  }
}

// Populate dropdowns
function populateDropdowns(selectedData = null) {
  // Populate courses
  let courseOptions = '<option value="">Select Course</option>';
  allCourses.forEach((course) => {
    courseOptions += `<option value="${course.id}" ${selectedData?.courseId === course.id ? "selected" : ""}>
                                    ${escapeHtml(course.title)}
                                 </option>`;
  });
  $("#classCourse").html(courseOptions);

  // Populate instructors
  let instructorOptions = '<option value="">Select Instructor</option>';
  const instructors = allUsers.filter((u) => u.role === "instructor");
  instructors.forEach((instructor) => {
    instructorOptions += `<option value="${instructor.id}" ${selectedData?.instructorId === instructor.id ? "selected" : ""}>
                                        ${instructor.name}
                                     </option>`;
  });
  $("#classInstructor").html(instructorOptions);

  // Populate students
  let studentOptions = "";
  const students = allUsers.filter((u) => u.role === "student");
  students.forEach((student) => {
    studentOptions += `<option value="${student.id}">${escapeHtml(student.name)} (${escapeHtml(student.email)})</option>`;
  });
  $("#classStudents").html(studentOptions);
}

// Save classroom
function saveClassroom() {
  const name = $("#className").val();
  const description = $("#classDescription").val();
  const courseId = parseInt($("#classCourse").val());
  const instructorId = parseInt($("#classInstructor").val());
  const students = $("#classStudents").val()
    ? $("#classStudents").val().map(Number)
    : [];
  const startDate = $("#startDate").val();
  const endDate = $("#endDate").val();
  const isActive = $("#isActive").is(":checked");

  if (!name || !courseId || !instructorId) {
    showToast("Error", "Please fill all required fields", "danger");
    return;
  }

  const classroomId = $("#classroomId").val();

  if (classroomId) {
    // Update existing classroom
    const index = allClassrooms.findIndex(
      (c) => c.id === parseInt(classroomId),
    );
    if (index !== -1) {
      allClassrooms[index] = {
        ...allClassrooms[index],
        name,
        description,
        courseId,
        instructorId,
        students,
        startDate,
        endDate,
        active: isActive,
        updatedDate: new Date().toISOString(),
      };
      showToast("Success", "Classroom updated successfully!", "success");
    }
  } else {
    // Create new classroom
    const newClassroom = {
      id: Date.now(),
      name,
      description,
      courseId,
      instructorId,
      students,
      startDate,
      endDate,
      active: isActive,
      assignments: [],
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };
    allClassrooms.push(newClassroom);
    showToast("Success", "Classroom created successfully!", "success");
  }

  saveClassrooms();
  filterAndRender();
  $("#classroomModal").modal("hide");
}

// View classroom details
function viewClassroom(id) {
  window.location.href = `classroom-detail.html?id=${id}`;
}

// Show delete modal
function showDeleteModal(id) {
  deleteId = id;
  $("#deleteModal").modal("show");
}

// Confirm delete
function confirmDelete() {
  allClassrooms = allClassrooms.filter((c) => c.id !== deleteId);
  saveClassrooms();
  filterAndRender();
  $("#deleteModal").modal("hide");
  showToast("Deleted", "Classroom has been deleted", "success");
}

// Escape HTML to prevent XSS
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

  $("#searchClassroom").on("input", function () {
    currentPage = 1;
    filterAndRender();
  });

  $("#statusFilter, #sortBy").on("change", function () {
    currentPage = 1;
    filterAndRender();
  });

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
