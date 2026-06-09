let currentUser = null;
let adminProfile = {};
let loginHistory = [];

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

// Load profile data
async function loadProfile() {
  // Load from localStorage or use defaults
  const savedProfile = localStorage.getItem(`admin_profile_${currentUser.id}`);
  if (savedProfile) {
    adminProfile = JSON.parse(savedProfile);
  } else {
    adminProfile = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || "+1 (555) 123-4567",
      department: "Information Technology",
      location: "Administration Building, Room 101",
      bio: "Senior System Administrator with over 5 years of experience in educational technology platforms.",
      avatar:
        currentUser.avatar || "https://randomuser.me/api/portraits/men/1.jpg",
      joinDate: currentUser.joinDate || "2023-01-15",
      lastLogin: new Date().toISOString(),
    };
    saveProfile();
  }

  // Load login history
  loadLoginHistory();

  renderProfile();
  loadStats();
  loadRecentActivity();
  loadLoginHistoryDisplay();
}

// Save profile
function saveProfile() {
  localStorage.setItem(
    `admin_profile_${currentUser.id}`,
    JSON.stringify(adminProfile),
  );
  // Update currentUser
  currentUser.name = adminProfile.name;
  currentUser.avatar = adminProfile.avatar;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

// Load login history
function loadLoginHistory() {
  const savedHistory = localStorage.getItem(
    `admin_login_history_${currentUser.id}`,
  );
  if (savedHistory) {
    loginHistory = JSON.parse(savedHistory);
  } else {
    loginHistory = [
      {
        date: "2024-02-15 09:30:00",
        ip: "192.168.1.1",
        device: "Chrome on Windows",
        location: "New York, USA",
      },
      {
        date: "2024-02-14 14:15:00",
        ip: "192.168.1.1",
        device: "Chrome on Windows",
        location: "New York, USA",
      },
      {
        date: "2024-02-13 08:45:00",
        ip: "192.168.1.1",
        device: "Firefox on Mac",
        location: "New York, USA",
      },
    ];
    saveLoginHistory();
  }
}

// Save login history
function saveLoginHistory() {
  localStorage.setItem(
    `admin_login_history_${currentUser.id}`,
    JSON.stringify(loginHistory),
  );
}

// Render profile
function renderProfile() {
  $("#profileAvatar").attr("src", adminProfile.avatar);
  $("#profileName").text(adminProfile.name);
  $("#profileEmail").text(adminProfile.email);
  $("#memberSince").text(new Date(adminProfile.joinDate).toLocaleDateString());

  $("#displayName").text(adminProfile.name);
  $("#displayEmail").text(adminProfile.email);
  $("#displayPhone").text(adminProfile.phone);
  $("#displayDepartment").text(adminProfile.department);
  $("#displayLocation").text(adminProfile.location);
}

// Load statistics
async function loadStats() {
  try {
    const usersResponse = await fetch("../../data/users.json");
    const usersData = await usersResponse.json();
    const totalUsers = usersData.users.length;

    const coursesResponse = await fetch("../../data/courses.json");
    const coursesData = await coursesResponse.json();
    const totalCourses = coursesData.courses.length;

    $("#managedUsers").text(totalUsers.toLocaleString());
    $("#managedCourses").text(totalCourses);
  } catch (error) {
    console.error("Error loading stats:", error);
    $("#managedUsers").text("0");
    $("#managedCourses").text("0");
  }
}

// Load recent activity
function loadRecentActivity() {
  const activities = [
    {
      type: "login",
      action: "Logged in",
      detail: "Successful login from Chrome browser",
      time: "Today, 09:30 AM",
    },
    {
      type: "action",
      action: "User Management",
      detail: "Approved new instructor account",
      time: "Yesterday, 02:15 PM",
    },
    {
      type: "settings",
      action: "System Settings",
      detail: "Updated platform configuration",
      time: "Yesterday, 11:00 AM",
    },
    {
      type: "action",
      action: "Course Management",
      detail: 'Added new course "Advanced React"',
      time: "Feb 14, 2024",
    },
    {
      type: "login",
      action: "Logged in",
      detail: "Successful login from Firefox",
      time: "Feb 14, 2024, 08:45 AM",
    },
  ];

  let html = "";
  activities.slice(0, 5).forEach((activity) => {
    let iconClass = "";
    if (activity.type === "login") iconClass = "login";
    else if (activity.type === "action") iconClass = "action";
    else iconClass = "settings";

    html += `
                    <div class="activity-item">
                        <div class="activity-icon ${iconClass}">
                            <i class="fas ${activity.type === "login" ? "fa-sign-in-alt" : activity.type === "action" ? "fa-check" : "fa-cog"}"></i>
                        </div>
                        <div class="flex-grow-1">
                            <strong>${escapeHtml(activity.action)}</strong>
                            <br>
                            <small>${escapeHtml(activity.detail)}</small>
                            <br>
                            <small class="text-muted">${escapeHtml(activity.time)}</small>
                        </div>
                    </div>
                `;
  });
  $("#recentActivity").html(html);
}

// Load login history display
function loadLoginHistoryDisplay() {
  let html = "";
  loginHistory.slice(0, 3).forEach((login) => {
    html += `
                    <div class="activity-item">
                        <div class="activity-icon login">
                            <i class="fas fa-laptop"></i>
                        </div>
                        <div class="flex-grow-1">
                            <strong>${login.device}</strong>
                            <br>
                            <small>IP: ${login.ip} | ${login.location}</small>
                            <br>
                            <small class="text-muted">${login.date}</small>
                        </div>
                    </div>
                `;
  });
  $("#loginHistory").html(html);
}

// Edit personal info
function editPersonalInfo() {
  $("#editName").val(adminProfile.name);
  $("#editPhone").val(adminProfile.phone);
  $("#editDepartment").val(adminProfile.department);
  $("#editLocation").val(adminProfile.location);
  $("#editBio").val(adminProfile.bio);
  $("#editPersonalModal").modal("show");
}

// Save personal info
function savePersonalInfo() {
  adminProfile.name = $("#editName").val();
  adminProfile.phone = $("#editPhone").val();
  adminProfile.department = $("#editDepartment").val();
  adminProfile.location = $("#editLocation").val();
  adminProfile.bio = $("#editBio").val();

  saveProfile();
  renderProfile();
  $("#editPersonalModal").modal("hide");
  showToast("Success", "Profile updated successfully!", "success");
}

// Change avatar
function changeAvatar() {
  const avatarUrl = prompt("Enter avatar image URL:", adminProfile.avatar);
  if (avatarUrl) {
    adminProfile.avatar = avatarUrl;
    saveProfile();
    renderProfile();
    showToast("Success", "Avatar updated!", "success");
  }
}

// Change password
function changePassword() {
  $("#changePasswordModal").modal("show");
}

// Check password strength
function checkPasswordStrength() {
  const password = $("#newPassword").val();
  const strengthBar = $("#strengthBar");

  if (password.length === 0) {
    strengthBar.removeClass("strength-weak strength-medium strength-strong");
    return;
  }

  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
  if (password.match(/[0-9]/)) strength++;
  if (password.match(/[^a-zA-Z0-9]/)) strength++;

  strengthBar.removeClass("strength-weak strength-medium strength-strong");

  if (strength <= 1) {
    strengthBar.addClass("strength-weak");
    $("#passwordHint").text("Weak password - add more variety");
  } else if (strength <= 3) {
    strengthBar.addClass("strength-medium");
    $("#passwordHint").text("Medium password - good, but could be stronger");
  } else {
    strengthBar.addClass("strength-strong");
    $("#passwordHint").text("Strong password!");
  }
}

// Update password
function updatePassword() {
  const currentPwd = $("#currentPassword").val();
  const newPwd = $("#newPassword").val();
  const confirmPwd = $("#confirmPassword").val();

  if (!currentPwd || !newPwd || !confirmPwd) {
    showToast("Error", "Please fill all fields", "danger");
    return;
  }

  if (newPwd !== confirmPwd) {
    showToast("Error", "New passwords do not match", "danger");
    return;
  }

  if (newPwd.length < 8) {
    showToast("Error", "Password must be at least 8 characters", "danger");
    return;
  }

  showToast("Success", "Password updated successfully!", "success");
  $("#changePasswordModal").modal("hide");
  $("#passwordForm")[0].reset();
}

// Enable 2FA
function enable2FA() {
  showToast(
    "2FA Setup",
    "Two-factor authentication setup would start here",
    "info",
  );
}

// Logout all devices
function logoutAllDevices() {
  if (
    confirm(
      "Log out from all devices? You will need to login again on all devices.",
    )
  ) {
    showToast("Logged Out", "Logged out from all other devices", "success");
  }
}

// View all activities
function viewAllActivities() {
  showToast("Activities", "Full activity log feature coming soon!", "info");
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

// Logout
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "../../login.html";
}

// Event listeners
$(document).ready(function () {
  checkAuth();
  loadProfile();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
