let currentUser = null;
let myClassrooms = [];
let myCourses = [];
let allStudents = [];
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
  if (currentUser.role !== "instructor") {
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
    myCourses = coursesData.courses.filter(
      (c) => c.instructorId === currentUser.id,
    );

    // Load classrooms
    const classroomsResponse = await fetch("../../assets/data/classrooms.json");
    const classroomsData = await classroomsResponse.json();
    myClassrooms = classroomsData.classrooms.filter(
      (c) => c.instructorId === currentUser.id,
    );

    // Load students
    const usersResponse = await fetch("../../assets/data/users.json");
    const usersData = await usersResponse.json();
    allStudents = usersData.users.filter((u) => u.role === "student");

    // Load saved classrooms from localStorage
    loadSavedClassrooms();

    // Populate course dropdown
    populateCourseSelect();
    populateStudentSelect();

    updateStats();
    filterAndRender();
  } catch (error) {
    console.error("Error loading data:", error);
    showToast("Error", "Failed to load data", "danger");
  }
}

// Load saved classrooms from localStorage
function loadSavedClassrooms() {
  const saved = localStorage.getItem(`instructor_classrooms_${currentUser.id}`);
  if (saved) {
    const savedClassrooms = JSON.parse(saved);
    savedClassrooms.forEach((savedClass) => {
      if (!myClassrooms.find((c) => c.id === savedClass.id)) {
        myClassrooms.push(savedClass);
      }
    });
  }
}

// Save classrooms to localStorage
function saveClassrooms() {
  localStorage.setItem(
    `instructor_classrooms_${currentUser.id}`,
    JSON.stringify(myClassrooms),
  );
}

// Populate course dropdown
function populateCourseSelect() {
  let options = '<option value="">Select Course</option>';
  myCourses.forEach((course) => {
    options += `<option value="${course.id}">${course.title}</option>`;
  });
  $("#classCourse").html(options);
}

// Populate student select
function populateStudentSelect() {
  let options = "";
  allStudents.forEach((student) => {
    options += `<option value="${student.id}">${student.name} (${student.email})</option>`;
  });
  $("#classStudents").html(options);
}

// Update statistics
function updateStats() {
  $("#totalClassrooms").text(myClassrooms.length);

  let totalStudents = 0;
  let totalAssignments = 0;
  myClassrooms.forEach((classroom) => {
    totalStudents += classroom.students?.length || 0;
    totalAssignments += classroom.assignments?.length || 0;
  });
  $("#totalStudents").text(totalStudents);
  $("#totalAssignments").text(totalAssignments);
}

// Filter and render classrooms
function filterAndRender() {
  const searchTerm = $("#searchClassroom").val().toLowerCase();
  const statusFilter = $("#statusFilter").val();
  const sortBy = $("#sortBy").val();

  filteredClassrooms = [...myClassrooms];

  // Apply search filter
  if (searchTerm) {
    filteredClassrooms = filteredClassrooms.filter((classroom) => {
      const course = myCourses.find((c) => c.id === classroom.courseId);
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
    case "recent":
      filteredClassrooms.sort(
        (a, b) => new Date(b.createdDate) - new Date(a.createdDate),
      );
      break;
  }

  currentPage = 1;
  renderClassrooms();
  renderPagination();
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
                        <button class="btn btn-success" onclick="showCreateModal()">
                            <i class="fas fa-plus"></i> Create Classroom
                        </button>
                    </div>
                `);
    return;
  }

  let html = '<div class="row">';
  pageClassrooms.forEach((classroom) => {
    const course = myCourses.find((c) => c.id === classroom.courseId);
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
                                    <div class="stat-number">${course?.students || 0}</div>
                                    <div class="stat-label">Enrolled</div>
                                </div>
                            </div>
                            <div class="classroom-body">
                                <p class="small text-muted mb-0">
                                    ${classroom.description || "No description provided"}
                                </p>
                                ${classroom.startDate ? `<small class="text-muted"><i class="fas fa-calendar"></i> Starts: ${classroom.startDate}</small>` : ""}
                            </div>
                            <div class="classroom-actions">
                                <div class="btn-group w-100" role="group">
                                    <button class="btn btn-sm btn-outline-success" onclick="viewClassroom(${classroom.id})">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editClassroom(${classroom.id})">
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
  $("#isActive").prop("checked", true);
  $("#classroomModal").modal("show");
}

// Edit classroom
function editClassroom(id) {
  const classroom = myClassrooms.find((c) => c.id === id);
  if (classroom) {
    $("#modalTitle").text("Edit Classroom");
    populateCourseSelect();
    populateStudentSelect();

    if ($("#classroomId").length === 0) {
      $("<input>")
        .attr({ type: "hidden", id: "classroomId", value: classroom.id })
        .appendTo("#classroomForm");
    } else {
      $("#classroomId").val(classroom.id);
    }

    $("#className").val(classroom.name);
    $("#classDescription").val(classroom.description || "");
    $("#classCourse").val(classroom.courseId);
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

// Save classroom
function saveClassroom() {
  const name = $("#className").val();
  const description = $("#classDescription").val();
  const courseId = parseInt($("#classCourse").val());
  const students = $("#classStudents").val()
    ? $("#classStudents").val().map(Number)
    : [];
  const startDate = $("#startDate").val();
  const endDate = $("#endDate").val();
  const isActive = $("#isActive").is(":checked");

  if (!name || !courseId) {
    showToast("Error", "Please fill all required fields", "danger");
    return;
  }

  const classroomId = $("#classroomId").val();
  const course = myCourses.find((c) => c.id === courseId);

  if (classroomId) {
    // Update existing classroom
    const index = myClassrooms.findIndex((c) => c.id === parseInt(classroomId));
    if (index !== -1) {
      myClassrooms[index] = {
        ...myClassrooms[index],
        name,
        description,
        courseId,
        courseTitle: course?.title,
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
      courseTitle: course?.title,
      instructorId: currentUser.id,
      students,
      startDate,
      endDate,
      active: isActive,
      assignments: [],
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };
    myClassrooms.push(newClassroom);
    showToast("Success", "Classroom created successfully!", "success");
  }

  saveClassrooms();
  updateStats();
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
  myClassrooms = myClassrooms.filter((c) => c.id !== deleteId);
  saveClassrooms();
  updateStats();
  filterAndRender();
  $("#deleteModal").modal("hide");
  showToast("Deleted", "Classroom has been deleted", "success");
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
  loadData();

  $("#searchClassroom").on("input", function () {
    filterAndRender();
  });

  $("#statusFilter, #sortBy").on("change", function () {
    filterAndRender();
  });

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
