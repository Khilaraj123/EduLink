let currentUser = null;
let instructorProfile = {};
let expertiseAreas = [];
let socialLinks = {};

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

// Load profile data
async function loadProfile() {
  // Load from localStorage or use defaults
  const savedProfile = localStorage.getItem(
    `instructor_profile_${currentUser.id}`,
  );
  if (savedProfile) {
    instructorProfile = JSON.parse(savedProfile);
  } else {
    instructorProfile = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || "+1 (555) 123-4567",
      specialization: "Full Stack Development",
      experience: 5,
      bio: "Passionate educator with over 5 years of experience in web development. Love helping students achieve their learning goals.",
      avatar:
        currentUser.avatar ||
        `https://randomuser.me/api/portraits/${currentUser.id % 2 === 0 ? "men" : "women"}/${currentUser.id}.jpg`,
      joinDate: currentUser.joinDate || "2023-06-10",
      expertise: [
        "Web Development",
        "JavaScript",
        "React",
        "Node.js",
        "Python",
      ],
      socialLinks: {
        linkedin: "https://linkedin.com/in/johndoe",
        github: "https://github.com/johndoe",
        twitter: "https://twitter.com/johndoe",
        website: "https://johndoe.com",
      },
    };
    saveProfile();
  }

  expertiseAreas = instructorProfile.expertise || [];
  socialLinks = instructorProfile.socialLinks || {};

  renderProfile();
  loadStats();
  loadRecentActivity();
  loadTeachingStats();
}

// Save profile
function saveProfile() {
  instructorProfile.expertise = expertiseAreas;
  instructorProfile.socialLinks = socialLinks;
  localStorage.setItem(
    `instructor_profile_${currentUser.id}`,
    JSON.stringify(instructorProfile),
  );
  // Update currentUser
  currentUser.name = instructorProfile.name;
  currentUser.avatar = instructorProfile.avatar;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

// Render profile
function renderProfile() {
  $("#profileAvatar").attr("src", instructorProfile.avatar);
  $("#profileName").text(instructorProfile.name);
  $("#profileEmail").text(instructorProfile.email);
  $("#memberSince").text(
    new Date(instructorProfile.joinDate).toLocaleDateString(),
  );
  $("#profileBio").html(
    `<i class="fas fa-quote-left"></i> ${instructorProfile.bio}`,
  );

  $("#displayName").text(instructorProfile.name);
  $("#displayEmail").text(instructorProfile.email);
  $("#displayPhone").text(instructorProfile.phone);
  $("#displaySpecialization").text(instructorProfile.specialization);
  $("#displayExperience").text(instructorProfile.experience + " years");

  // Render expertise areas
  let expertiseHtml = "";
  expertiseAreas.forEach((area) => {
    expertiseHtml += `
                    <span class="expertise-badge">
                        ${area} <i class="fas fa-times" onclick="removeExpertise('${area}')"></i>
                    </span>
                `;
  });
  $("#expertiseContainer").html(
    expertiseHtml || '<p class="text-muted">No expertise areas added</p>',
  );

  // Render social links
  let socialHtml = "";
  if (socialLinks.linkedin) {
    socialHtml += `<a href="${socialLinks.linkedin}" target="_blank" class="social-link"><i class="fab fa-linkedin fa-2x"></i></a>`;
  }
  if (socialLinks.github) {
    socialHtml += `<a href="${socialLinks.github}" target="_blank" class="social-link"><i class="fab fa-github fa-2x"></i></a>`;
  }
  if (socialLinks.twitter) {
    socialHtml += `<a href="${socialLinks.twitter}" target="_blank" class="social-link"><i class="fab fa-twitter fa-2x"></i></a>`;
  }
  if (socialLinks.website) {
    socialHtml += `<a href="${socialLinks.website}" target="_blank" class="social-link"><i class="fas fa-globe fa-2x"></i></a>`;
  }
  $("#socialLinks").html(
    socialHtml || '<p class="text-muted">No social links added</p>',
  );
}

// Load statistics
async function loadStats() {
  try {
    const coursesResponse = await fetch("../../data/courses.json");
    const coursesData = await coursesResponse.json();
    const myCourses = coursesData.courses.filter(
      (c) => c.instructorId === currentUser.id,
    );
    const totalCourses = myCourses.length;
    const totalStudents = myCourses.reduce(
      (sum, c) => sum + (c.students || 0),
      0,
    );

    $("#instructorCourses").text(totalCourses);
    $("#instructorStudents").text(totalStudents.toLocaleString());
    $("#courseCount").text(totalCourses);
    $("#teachingSince").text(
      new Date(instructorProfile.joinDate).getFullYear(),
    );
  } catch (error) {
    console.error("Error loading stats:", error);
    $("#instructorCourses").text("0");
    $("#instructorStudents").text("0");
  }
}

// Load recent activity
function loadRecentActivity() {
  const activities = [
    {
      type: "course",
      action: "Course Updated",
      detail: 'Updated "Web Development Bootcamp" curriculum',
      time: "2 hours ago",
      icon: "fa-edit",
    },
    {
      type: "student",
      action: "New Enrollment",
      detail: "5 students enrolled in Python course",
      time: "1 day ago",
      icon: "fa-user-plus",
    },
    {
      type: "earning",
      action: "Payout Received",
      detail: "Monthly earnings deposited - $1,250",
      time: "3 days ago",
      icon: "fa-dollar-sign",
    },
  ];

  let html = "";
  activities.forEach((activity) => {
    let iconClass = "";
    if (activity.type === "course") iconClass = "course";
    else if (activity.type === "student") iconClass = "student";
    else iconClass = "earning";

    html += `
                    <div class="activity-item">
                        <div class="activity-icon ${iconClass}">
                            <i class="fas ${activity.icon}"></i>
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

// Load teaching stats
async function loadTeachingStats() {
  try {
    const coursesResponse = await fetch("../../data/courses.json");
    const coursesData = await coursesResponse.json();
    const myCourses = coursesData.courses.filter(
      (c) => c.instructorId === currentUser.id,
    );

    const avgRating =
      myCourses.length > 0
        ? myCourses.reduce((sum, c) => sum + (c.rating || 0), 0) /
          myCourses.length
        : 0;

    // Generate star rating
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      stars += `<i class="${i <= Math.round(avgRating) ? "fas" : "far"} fa-star"></i>`;
    }
    $("#avgRatingStars").html(stars);
    $("#avgRatingValue").text(avgRating.toFixed(1));

    // Simulate satisfaction and completion rates
    const satisfaction = Math.floor(Math.random() * 20) + 75;
    const completion = Math.floor(Math.random() * 30) + 60;

    $("#satisfactionRate").css("width", `${satisfaction}%`);
    $("#satisfactionText").text(`${satisfaction}%`);
    $("#completionRate").css("width", `${completion}%`);
    $("#completionText").text(`${completion}%`);
  } catch (error) {
    console.error("Error loading teaching stats:", error);
  }
}

// Edit personal info
function editPersonalInfo() {
  $("#editName").val(instructorProfile.name);
  $("#editPhone").val(instructorProfile.phone);
  $("#editSpecialization").val(instructorProfile.specialization);
  $("#editExperience").val(instructorProfile.experience);
  $("#editBio").val(instructorProfile.bio);
  $("#editPersonalModal").modal("show");
}

// Save personal info
function savePersonalInfo() {
  instructorProfile.name = $("#editName").val();
  instructorProfile.phone = $("#editPhone").val();
  instructorProfile.specialization = $("#editSpecialization").val();
  instructorProfile.experience = parseInt($("#editExperience").val());
  instructorProfile.bio = $("#editBio").val();

  saveProfile();
  renderProfile();
  $("#editPersonalModal").modal("hide");
  showToast("Success", "Profile updated successfully!", "success");
}

// Change avatar
function changeAvatar() {
  const avatarUrl = prompt("Enter avatar image URL:", instructorProfile.avatar);
  if (avatarUrl) {
    instructorProfile.avatar = avatarUrl;
    saveProfile();
    renderProfile();
    showToast("Success", "Avatar updated!", "success");
  }
}

// Add expertise
function addExpertise() {
  $("#addExpertiseModal").modal("show");
}

function addNewExpertise() {
  const expertise = $("#newExpertise").val().trim();
  if (expertise && !expertiseAreas.includes(expertise)) {
    expertiseAreas.push(expertise);
    saveProfile();
    renderProfile();
    showToast("Success", `Expertise "${expertise}" added!`, "success");
    $("#newExpertise").val("");
    $("#addExpertiseModal").modal("hide");
  }
}

function removeExpertise(expertise) {
  expertiseAreas = expertiseAreas.filter((e) => e !== expertise);
  saveProfile();
  renderProfile();
  showToast("Removed", `Expertise "${expertise}" removed`, "info");
}

// Edit social links
function editSocialLinks() {
  $("#linkedinUrl").val(socialLinks.linkedin || "");
  $("#githubUrl").val(socialLinks.github || "");
  $("#twitterUrl").val(socialLinks.twitter || "");
  $("#websiteUrl").val(socialLinks.website || "");
  $("#socialLinksModal").modal("show");
}

function saveSocialLinks() {
  socialLinks = {
    linkedin: $("#linkedinUrl").val(),
    github: $("#githubUrl").val(),
    twitter: $("#twitterUrl").val(),
    website: $("#websiteUrl").val(),
  };
  saveProfile();
  renderProfile();
  $("#socialLinksModal").modal("hide");
  showToast("Success", "Social links updated!", "success");
}

// Change password
function changePassword() {
  $("#changePasswordModal").modal("show");
}

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
