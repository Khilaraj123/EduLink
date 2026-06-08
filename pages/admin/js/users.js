let currentUser = null;
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let itemsPerPage = 12;
let deleteUserId = null;
let currentViewUserId = null;

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

// Load users
async function loadUsers() {
  try {
    const response = await fetch("../../assets/data/users.json");
    const data = await response.json();
    allUsers = data.users;

    // Load saved users from localStorage
    loadSavedUsers();

    updateStats();
    filterUsers();
  } catch (error) {
    console.error("Error loading users:", error);
    showToast("Error", "Failed to load users", "danger");
  }
}

// Load saved users from localStorage
function loadSavedUsers() {
  const saved = localStorage.getItem("admin_users");
  if (saved) {
    const savedUsers = JSON.parse(saved);
    savedUsers.forEach((savedUser) => {
      if (!allUsers.find((u) => u.id === savedUser.id)) {
        allUsers.push(savedUser);
      }
    });
  }
}

// Save users to localStorage
function saveUsers() {
  localStorage.setItem("admin_users", JSON.stringify(allUsers));
}

// Update statistics
function updateStats() {
  const students = allUsers.filter((u) => u.role === "student").length;
  const instructors = allUsers.filter((u) => u.role === "instructor").length;
  const admins = allUsers.filter((u) => u.role === "admin").length;

  $("#totalUsers").text(allUsers.length);
  $("#totalStudents").text(students);
  $("#totalInstructors").text(instructors);
  $("#totalAdmins").text(admins);

  $("#userSummary").html(`
                <small>👨‍🎓 Students: ${students}</small><br>
                <small>👨‍🏫 Instructors: ${instructors}</small><br>
                <small>👑 Admins: ${admins}</small>
            `);
}

// Filter users
function filterUsers() {
  const searchTerm = $("#searchUser").val().toLowerCase();
  const roleFilter = $("#roleFilter").val();
  const statusFilter = $("#statusFilter").val();

  filteredUsers = [...allUsers];

  // Apply search filter
  if (searchTerm) {
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm),
    );
  }

  // Apply role filter
  if (roleFilter !== "all") {
    filteredUsers = filteredUsers.filter((user) => user.role === roleFilter);
  }

  // Apply status filter
  if (statusFilter !== "all") {
    filteredUsers = filteredUsers.filter(
      (user) => user.status === statusFilter,
    );
  }

  currentPage = 1;
  renderUsers();
  renderPagination();
}

// Filter by role (from stats cards)
function filterByRole(role) {
  $("#roleFilter").val(role);
  $("#searchUser").val("");
  filterUsers();
}

// Render users
function renderUsers() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageUsers = filteredUsers.slice(start, end);

  if (pageUsers.length === 0) {
    $("#usersContainer").html(`
                    <div class="text-center py-5">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <h4>No Users Found</h4>
                        <p>Try adjusting your search or filter criteria</p>
                        <button class="btn btn-primary" onclick="showAddUserModal()">
                            <i class="fas fa-user-plus"></i> Add New User
                        </button>
                    </div>
                `);
    return;
  }

  let html = '<div class="row">';
  pageUsers.forEach((user) => {
    const roleClass =
      user.role === "student"
        ? "role-student"
        : user.role === "instructor"
          ? "role-instructor"
          : "role-admin";
    const roleIcon =
      user.role === "student"
        ? "fa-user-graduate"
        : user.role === "instructor"
          ? "fa-chalkboard-teacher"
          : "fa-user-shield";
    const status = user.status !== "inactive";

    html += `
                    <div class="col-md-6 col-lg-3">
                        <div class="user-card" onclick="viewUser(${user.id})">
                            <div class="text-center">
                                <img src="${user.avatar || "https://randomuser.me/api/portraits/men/1.jpg"}" 
                                     class="user-avatar" alt="${user.name}">
                                <div class="user-name">${escapeHtml(user.name)}</div>
                                <div class="user-role">
                                    <span class="role-badge ${roleClass}">
                                        <i class="fas ${roleIcon}"></i> ${user.role}
                                    </span>
                                </div>
                                <div class="enrollment-stats">
                                    <i class="fas fa-envelope"></i> ${user.email}
                                </div>
                                <div class="mt-2">
                                    <span class="${status ? "status-active" : "status-inactive"}">
                                        <i class="fas fa-circle"></i> ${status ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); editUser(${user.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); showDeleteModal(${user.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
  });
  html += "</div>";

  $("#usersContainer").html(html);
}

// Render pagination
function renderPagination() {
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
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
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderUsers();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// View user details
function viewUser(userId) {
  const user = allUsers.find((u) => u.id === userId);
  if (user) {
    currentViewUserId = userId;
    const roleClass =
      user.role === "student"
        ? "role-student"
        : user.role === "instructor"
          ? "role-instructor"
          : "role-admin";
    const roleIcon =
      user.role === "student"
        ? "fa-user-graduate"
        : user.role === "instructor"
          ? "fa-chalkboard-teacher"
          : "fa-user-shield";

    $("#viewUserContent").html(`
                    <div class="text-center mb-3">
                        <img src="${user.avatar || "https://randomuser.me/api/portraits/men/1.jpg"}" 
                             class="user-avatar" style="width: 120px; height: 120px;" alt="${user.name}">
                        <h4>${escapeHtml(user.name)}</h4>
                        <span class="role-badge ${roleClass}">
                            <i class="fas ${roleIcon}"></i> ${user.role}
                        </span>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-6">
                            <strong>Email:</strong>
                        </div>
                        <div class="col-6">
                            ${user.email}
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <strong>User ID:</strong>
                        </div>
                        <div class="col-6">
                            ${user.id}
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <strong>Status:</strong>
                        </div>
                        <div class="col-6">
                            <span class="${user.status !== "inactive" ? "status-active" : "status-inactive"}">
                                ${user.status !== "inactive" ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <strong>Joined Date:</strong>
                        </div>
                        <div class="col-6">
                            ${user.joinDate || "2024-01-15"}
                        </div>
                    </div>
                    ${
                      user.role === "student" && user.enrolledCourses
                        ? `
                        <div class="row mt-2">
                            <div class="col-6">
                                <strong>Enrolled Courses:</strong>
                            </div>
                            <div class="col-6">
                                ${user.enrolledCourses.length}
                            </div>
                        </div>
                    `
                        : ""
                    }
                    ${
                      user.role === "instructor" && user.courses
                        ? `
                        <div class="row mt-2">
                            <div class="col-6">
                                <strong>Created Courses:</strong>
                            </div>
                            <div class="col-6">
                                ${user.courses.length}
                            </div>
                        </div>
                    `
                        : ""
                    }
                `);

    $("#viewUserModal").modal("show");
  }
}

// Edit from view
function editFromView() {
  $("#viewUserModal").modal("hide");
  editUser(currentViewUserId);
}

// Show add user modal
function showAddUserModal() {
  $("#modalTitle").text("Add New User");
  $("#userForm")[0].reset();
  $("#userId").remove();
  $("#userPassword").prop("required", true);
  $("#userModal").modal("show");
}

// Edit user
function editUser(userId) {
  const user = allUsers.find((u) => u.id === userId);
  if (user) {
    $("#modalTitle").text("Edit User");
    $("#userName").val(user.name);
    $("#userEmail").val(user.email);
    $("#userRole").val(user.role);
    $("#userStatus").val(user.status || "active");
    $("#userAvatar").val(user.avatar || "");
    $("#userPassword").prop("required", false);

    // Add hidden ID field
    if ($("#userId").length === 0) {
      $("<input>")
        .attr({
          type: "hidden",
          id: "userId",
          value: user.id,
        })
        .appendTo("#userForm");
    } else {
      $("#userId").val(user.id);
    }

    $("#userModal").modal("show");
  }
}

// Save user
function saveUser() {
  const name = $("#userName").val();
  const email = $("#userEmail").val();
  const password = $("#userPassword").val();
  const role = $("#userRole").val();
  const status = $("#userStatus").val();
  const avatar =
    $("#userAvatar").val() ||
    `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? "men" : "women"}/${Math.floor(Math.random() * 100)}.jpg`;

  if (!name || !email) {
    showToast("Error", "Please fill all required fields", "danger");
    return;
  }

  const userId = $("#userId").val();

  if (userId) {
    // Update existing user
    const index = allUsers.findIndex((u) => u.id === parseInt(userId));
    if (index !== -1) {
      allUsers[index] = {
        ...allUsers[index],
        name,
        email,
        role,
        status,
        avatar,
        updatedDate: new Date().toISOString(),
      };

      // Update password if provided
      if (password) {
        allUsers[index].password = password;
      }

      showToast("Success", "User updated successfully!", "success");
    }
  } else {
    // Create new user
    if (!password) {
      showToast("Error", "Password is required for new users", "danger");
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      role,
      status,
      avatar,
      joinDate: new Date().toISOString().split("T")[0],
      enrolledCourses: role === "student" ? [] : undefined,
      courses: role === "instructor" ? [] : undefined,
    };

    allUsers.push(newUser);
    showToast("Success", "User created successfully!", "success");
  }

  saveUsers();
  updateStats();
  filterUsers();
  $("#userModal").modal("hide");
}

// Show delete modal
function showDeleteModal(userId) {
  deleteUserId = userId;
  $("#deleteModal").modal("show");
}

// Confirm delete
function confirmDelete() {
  allUsers = allUsers.filter((u) => u.id !== deleteUserId);
  saveUsers();
  updateStats();
  filterUsers();
  $("#deleteModal").modal("hide");
  showToast("Deleted", "User has been deleted", "success");
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
  loadUsers();

  $("#searchUser").on("input", function () {
    filterUsers();
  });

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
