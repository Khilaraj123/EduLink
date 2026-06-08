let currentUser = null;
let userProfile = {};
let userSkills = [];
let userGoals = [];
let userAchievements = [];

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

// Load profile data
function loadProfile() {
  // Load from localStorage or use defaults
  const savedProfile = localStorage.getItem(`profile_${currentUser.id}`);
  if (savedProfile) {
    userProfile = JSON.parse(savedProfile);
  } else {
    userProfile = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || "+1 234 567 8900",
      location: currentUser.location || "New York, USA",
      occupation: currentUser.occupation || "Student",
      bio:
        currentUser.bio ||
        "Passionate learner exploring new technologies and building amazing projects.",
      avatar:
        currentUser.avatar ||
        `https://randomuser.me/api/portraits/${currentUser.id % 2 === 0 ? "men" : "women"}/${currentUser.id}.jpg`,
      joinDate: currentUser.joinDate || "2024-01-15",
      skills: currentUser.skills || ["HTML", "CSS", "JavaScript", "React"],
      goals: currentUser.goals || [
        "Complete Web Development Bootcamp",
        "Build 10 full-stack projects",
        "Learn Python for Data Science",
        "Get certified in Cloud Computing",
      ],
      achievements: [
        {
          id: 1,
          name: "Quick Starter",
          description: "Completed first course",
          icon: "fa-rocket",
          earned: true,
          date: "2024-01-20",
        },
        {
          id: 2,
          name: "Knowledge Seeker",
          description: "Enrolled in 5 courses",
          icon: "fa-book",
          earned: true,
          date: "2024-02-15",
        },
        {
          id: 3,
          name: "Community Hero",
          description: "Posted 10 helpful answers",
          icon: "fa-heart",
          earned: false,
          progress: 60,
        },
        {
          id: 4,
          name: "Perfect Attendance",
          description: "30-day learning streak",
          icon: "fa-calendar-check",
          earned: false,
          progress: 40,
        },
      ],
    };
    saveProfile();
  }

  renderProfile();
  loadStats();
  loadRecentActivity();
  loadCertificates();
  updateProfileStrength();
}

// Save profile
function saveProfile() {
  localStorage.setItem(
    `profile_${currentUser.id}`,
    JSON.stringify(userProfile),
  );
  // Update currentUser in localStorage
  currentUser.name = userProfile.name;
  currentUser.avatar = userProfile.avatar;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

// Render profile
function renderProfile() {
  $("#profileAvatar").attr("src", userProfile.avatar);
  $("#profileName").text(userProfile.name);
  $("#profileEmail").text(userProfile.email);
  $("#memberSince").text(new Date(userProfile.joinDate).toLocaleDateString());
  $("#profileBio").html(`<i class="fas fa-quote-left"></i> ${userProfile.bio}`);

  $("#displayName").text(userProfile.name);
  $("#displayEmail").text(userProfile.email);
  $("#displayPhone").text(userProfile.phone);
  $("#displayLocation").text(userProfile.location);
  $("#displayOccupation").text(userProfile.occupation);

  // Render skills
  let skillsHtml = "";
  userProfile.skills.forEach((skill) => {
    skillsHtml += `
                    <span class="skill-tag">
                        ${skill} <i class="fas fa-times" onclick="removeSkill('${skill}')"></i>
                    </span>
                `;
  });
  $("#skillsContainer").html(
    skillsHtml || '<p class="text-muted">No skills added yet</p>',
  );

  // Render goals
  let goalsHtml = '<ul class="list-unstyled">';
  userProfile.goals.forEach((goal) => {
    goalsHtml += `<li><i class="fas fa-check-circle text-success me-2"></i> ${goal}</li>`;
  });
  goalsHtml += "</ul>";
  $("#goalsContainer").html(goalsHtml);

  // Render achievements
  let achievementsHtml = "";
  userProfile.achievements.forEach((achievement) => {
    if (achievement.earned) {
      achievementsHtml += `
                        <div class="achievement-card">
                            <div class="achievement-icon">
                                <i class="fas ${achievement.icon}"></i>
                            </div>
                            <h6>${achievement.name}</h6>
                            <small>${achievement.description}</small>
                            <div class="mt-2">
                                <small>Earned: ${achievement.date}</small>
                            </div>
                        </div>
                    `;
    }
  });
  $("#achievementsContainer").html(
    achievementsHtml ||
      '<p class="text-muted">No achievements yet. Keep learning!</p>',
  );
}

// Load statistics
async function loadStats() {
  try {
    const response = await fetch("../../assets/data/courses.json");
    const data = await response.json();
    const enrolledCourses = currentUser.enrolledCourses || [];
    const totalCourses = enrolledCourses.length;

    // Calculate completed courses
    let completedCount = 0;
    let totalHours = 0;

    for (const courseId of enrolledCourses) {
      const progress = localStorage.getItem(
        `course_progress_${currentUser.id}_${courseId}`,
      );
      if (progress) {
        const progressData = JSON.parse(progress);
        const course = data.courses.find((c) => c.id === courseId);
        if (course) {
          const totalLessons = course.curriculum.length;
          if (progressData.completedLessons.length === totalLessons) {
            completedCount++;
          }
          totalHours +=
            (progressData.completedLessons.length / totalLessons) * 40; // Approximate hours
        }
      }
    }

    $("#totalCourses").text(totalCourses);
    $("#certificatesEarned").text(completedCount);
    $("#learningHours").text(Math.floor(totalHours));

    const earnedAchievements = userProfile.achievements.filter(
      (a) => a.earned,
    ).length;
    $("#achievementsCount").text(earnedAchievements);
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// Load recent activity
function loadRecentActivity() {
  const activities = JSON.parse(
    localStorage.getItem(`activities_${currentUser.id}`),
  ) || [
    {
      id: 1,
      type: "course",
      title: "Started Web Development Bootcamp",
      date: "2024-02-10",
      icon: "fa-play",
    },
    {
      id: 2,
      type: "achievement",
      title: 'Earned "Quick Starter" badge',
      date: "2024-02-12",
      icon: "fa-trophy",
    },
    {
      id: 3,
      type: "community",
      title: "Posted in Community Forum",
      date: "2024-02-14",
      icon: "fa-comment",
    },
    {
      id: 4,
      type: "course",
      title: "Completed Module 3 of Python Course",
      date: "2024-02-15",
      icon: "fa-check",
    },
  ];

  let html = "";
  activities.slice(0, 5).forEach((activity) => {
    let iconClass = "";
    if (activity.type === "course") iconClass = "course";
    else if (activity.type === "achievement") iconClass = "achievement";
    else iconClass = "community";

    html += `
                    <div class="activity-item">
                        <div class="d-flex align-items-center">
                            <div class="activity-icon ${iconClass}">
                                <i class="fas ${activity.icon}"></i>
                            </div>
                            <div class="flex-grow-1">
                                <strong>${activity.title}</strong>
                                <br>
                                <small class="text-muted">${activity.date}</small>
                            </div>
                        </div>
                    </div>
                `;
  });

  $("#recentActivity").html(
    html || '<p class="text-muted">No recent activity</p>',
  );
}

// Load certificates
function loadCertificates() {
  const certificates = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`certificate_${currentUser.id}_`)) {
      const cert = JSON.parse(localStorage.getItem(key));
      certificates.push(cert);
    }
  }

  if (certificates.length === 0) {
    $("#certificatesContainer").html(
      '<p class="text-muted">No certificates yet. Complete courses to earn certificates!</p>',
    );
    return;
  }

  let html = "";
  certificates.forEach((cert) => {
    html += `
                    <div class="certificate-card">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <i class="fas fa-certificate text-warning fa-2x me-3"></i>
                                <strong>${cert.courseTitle}</strong>
                                <br>
                                <small class="text-muted">Completed: ${new Date(cert.completionDate).toLocaleDateString()}</small>
                            </div>
                            <button class="btn btn-sm btn-outline-primary" onclick="downloadCertificate('${cert.certificateId}')">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                `;
  });

  $("#certificatesContainer").html(html);
}

// Update profile strength
function updateProfileStrength() {
  let strength = 0;
  if (userProfile.phone && userProfile.phone !== "+1 234 567 8900")
    strength += 10;
  if (userProfile.location && userProfile.location !== "New York, USA")
    strength += 10;
  if (userProfile.occupation && userProfile.occupation !== "Student")
    strength += 10;
  if (userProfile.bio && userProfile.bio.length > 50) strength += 10;
  if (userProfile.skills.length > 3) strength += 20;
  if (userProfile.goals.length > 2) strength += 20;
  if (userProfile.avatar !== currentUser.avatar) strength += 10;
  if (currentUser.enrolledCourses && currentUser.enrolledCourses.length > 0)
    strength += 10;

  $("#profileStrength").css("width", `${strength}%`);

  let message = "";
  if (strength < 30) message = "Complete your profile to get started!";
  else if (strength < 60)
    message = "Good progress! Add more details to complete your profile.";
  else if (strength < 90) message = "Almost there! Just a few more steps.";
  else message = "Excellent! Your profile is complete!";

  $("#strengthMessage").text(message);
}

// Edit personal info
function editPersonalInfo() {
  $("#editName").val(userProfile.name);
  $("#editPhone").val(userProfile.phone);
  $("#editLocation").val(userProfile.location);
  $("#editOccupation").val(userProfile.occupation);
  $("#editBio").val(userProfile.bio);
  $("#editPersonalModal").modal("show");
}

// Save personal info
function savePersonalInfo() {
  userProfile.name = $("#editName").val();
  userProfile.phone = $("#editPhone").val();
  userProfile.location = $("#editLocation").val();
  userProfile.occupation = $("#editOccupation").val();
  userProfile.bio = $("#editBio").val();

  saveProfile();
  renderProfile();
  updateProfileStrength();
  $("#editPersonalModal").modal("hide");
  showToast("Success", "Profile updated successfully!", "success");
}

// Change avatar
function changeAvatar() {
  const avatarUrl = prompt("Enter avatar image URL:", userProfile.avatar);
  if (avatarUrl) {
    userProfile.avatar = avatarUrl;
    saveProfile();
    renderProfile();
    updateProfileStrength();
    showToast("Success", "Avatar updated!", "success");
  }
}

// Add skill
function addSkill() {
  $("#addSkillModal").modal("show");
}

function addNewSkill() {
  const skill = $("#newSkill").val().trim();
  if (skill && !userProfile.skills.includes(skill)) {
    userProfile.skills.push(skill);
    saveProfile();
    renderProfile();
    updateProfileStrength();
    showToast("Success", `Skill "${skill}" added!`, "success");
    $("#newSkill").val("");
    $("#addSkillModal").modal("hide");
  } else if (userProfile.skills.includes(skill)) {
    showToast("Error", "Skill already exists!", "danger");
  }
}

// Remove skill
function removeSkill(skill) {
  userProfile.skills = userProfile.skills.filter((s) => s !== skill);
  saveProfile();
  renderProfile();
  updateProfileStrength();
  showToast("Success", `Skill "${skill}" removed`, "info");
}

// Edit goals
function editGoals() {
  $("#editGoals").val(userProfile.goals.join("\n"));
  $("#editGoalsModal").modal("show");
}

// Save goals
function saveGoals() {
  const goalsText = $("#editGoals").val();
  userProfile.goals = goalsText.split("\n").filter((g) => g.trim());
  saveProfile();
  renderProfile();
  updateProfileStrength();
  $("#editGoalsModal").modal("hide");
  showToast("Success", "Learning goals updated!", "success");
}

// Download certificate
function downloadCertificate(certificateId) {
  showToast(
    "Certificate",
    "Certificate download would start in production",
    "success",
  );
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
