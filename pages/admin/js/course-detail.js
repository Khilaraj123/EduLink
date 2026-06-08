let currentUser = null;
let currentCourse = null;
let allStudents = [];
let courseReviews = [];

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

// Get course ID from URL
function getCourseId() {
  const urlParams = new URLSearchParams(window.location.search);
  return parseInt(urlParams.get("id"));
}

// Load course data
async function loadCourseData() {
  const courseId = getCourseId();
  if (!courseId) {
    window.location.href = "courses.html";
    return;
  }

  try {
    // Load courses
    const coursesResponse = await fetch("../../assets/data/courses.json");
    const coursesData = await coursesResponse.json();
    currentCourse = coursesData.courses.find((c) => c.id === courseId);

    if (!currentCourse) {
      showToast("Error", "Course not found", "danger");
      setTimeout(() => (window.location.href = "courses.html"), 2000);
      return;
    }

    // Load users
    const usersResponse = await fetch("../../assets/data/users.json");
    const usersData = await usersResponse.json();
    allStudents = usersData.users.filter((u) => u.role === "student");

    // Load reviews from localStorage
    loadReviews();

    renderCourseDetails();
    loadEnrolledStudents();
    calculateMetrics();
  } catch (error) {
    console.error("Error loading course data:", error);
    showToast("Error", "Failed to load course data", "danger");
  }
}

// Load reviews
function loadReviews() {
  const savedReviews = localStorage.getItem(`reviews_${currentCourse.id}`);
  if (savedReviews) {
    courseReviews = JSON.parse(savedReviews);
  } else {
    // Generate sample reviews
    courseReviews = [
      {
        id: 1,
        userName: "John Student",
        rating: 5,
        comment: "Excellent course! Very comprehensive and well-structured.",
        date: "2024-02-10",
      },
      {
        id: 2,
        userName: "Sarah Johnson",
        rating: 4,
        comment: "Great content, but some sections could be more detailed.",
        date: "2024-02-12",
      },
      {
        id: 3,
        userName: "Mike Brown",
        rating: 5,
        comment: "Best course I've taken! Highly recommend.",
        date: "2024-02-14",
      },
    ];
    saveReviews();
  }
}

// Save reviews
function saveReviews() {
  localStorage.setItem(
    `reviews_${currentCourse.id}`,
    JSON.stringify(courseReviews),
  );
}

// Render course details
function renderCourseDetails() {
  $("#courseTitle").text(currentCourse.title);
  $("#courseDescription").text(currentCourse.description);
  $("#courseImage").attr("src", currentCourse.image);
  $("#courseLevel").html(
    `<i class="fas fa-signal"></i> ${currentCourse.level}`,
  );
  $("#instructorName").text(currentCourse.instructorName);
  $("#courseDuration").text(currentCourse.duration);
  $("#coursePrice").text(`$${currentCourse.price}`);
  $("#courseIdDisplay").text(currentCourse.id);
  $("#instructorEmail").text(
    `${currentCourse.instructorName.toLowerCase().replace(" ", ".")}@edulink.com`,
  );
  $("#createdDate").text(currentCourse.createdDate || "2024-01-15");
  $("#updatedDate").text(currentCourse.updatedDate || "2024-02-01");
  $("#totalStudents").text(currentCourse.students || 0);
  $("#courseRating").text(currentCourse.rating || 4.5);
  $("#totalLessons").text(currentCourse.curriculum?.length || 0);

  // Render curriculum
  renderCurriculum();

  // Render reviews
  renderReviews();
}

// Render curriculum
function renderCurriculum() {
  const curriculum = currentCourse.curriculum || [];
  if (curriculum.length === 0) {
    $("#curriculumList").html(
      '<p class="text-muted">No lessons added yet.</p>',
    );
    return;
  }

  let html = "";
  curriculum.forEach((lesson, index) => {
    html += `
                    <div class="curriculum-item">
                        <div>
                            <i class="fas fa-play-circle text-primary me-2"></i>
                            <strong>Lesson ${index + 1}:</strong> ${escapeHtml(lesson)}
                        </div>
                        <div>
                            <i class="fas fa-edit text-primary me-2" style="cursor:pointer" onclick="editLesson(${index})"></i>
                            <i class="fas fa-trash text-danger" style="cursor:pointer" onclick="removeLesson(${index})"></i>
                        </div>
                    </div>
                `;
  });
  $("#curriculumList").html(html);
}

// Load enrolled students
function loadEnrolledStudents() {
  // Simulate enrolled students
  const enrolledStudents = allStudents.slice(
    0,
    Math.floor(Math.random() * allStudents.length),
  );

  if (enrolledStudents.length === 0) {
    $("#studentsList").html(
      '<tr><td colspan="3" class="text-center">No enrolled students</td></tr>',
    );
    return;
  }

  let html = "";
  enrolledStudents.forEach((student, index) => {
    const progress = Math.floor(Math.random() * 100);
    html += `
                    <tr>
                        <td>
                            <img src="${student.avatar || "https://randomuser.me/api/portraits/men/1.jpg"}" 
                                 class="student-avatar" alt="${student.name}">
                            ${student.name}
                        </td>
                        <td>
                            <div class="progress" style="width: 100px;">
                                <div class="progress-bar bg-success" style="width: ${progress}%"></div>
                            </div>
                            <small>${progress}%</small>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger" onclick="removeStudent(${student.id})">
                                <i class="fas fa-user-minus"></i>
                            </button>
                        </td>
                    </tr>
                `;
  });
  $("#studentsList").html(html);
}

// Render reviews
function renderReviews() {
  if (courseReviews.length === 0) {
    $("#reviewsList").html('<p class="text-muted">No reviews yet.</p>');
    return;
  }

  // Calculate average rating
  const avgRating =
    courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length;
  $("#averageRating").html(
    generateStarRating(avgRating) + ` (${avgRating.toFixed(1)})`,
  );

  let html = "";
  courseReviews.forEach((review) => {
    html += `
                    <div class="review-item">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>${review.userName}</strong>
                                <div class="rating-stars">
                                    ${generateStarRating(review.rating)}
                                </div>
                            </div>
                            <small class="text-muted">${review.date}</small>
                        </div>
                        <p class="mt-2 mb-0">${review.comment}</p>
                    </div>
                `;
  });
  $("#reviewsList").html(html);
}

// Generate star rating
function generateStarRating(rating) {
  let stars = "";
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star text-warning"></i>';
  }
  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt text-warning"></i>';
  }
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star text-warning"></i>';
  }
  return stars;
}

// Calculate performance metrics
function calculateMetrics() {
  // Simulated metrics
  const completionRate = Math.floor(Math.random() * 40) + 50;
  const avgGrade = Math.floor(Math.random() * 30) + 60;
  const satisfaction = Math.floor(Math.random() * 20) + 75;

  $("#completionRate").css("width", `${completionRate}%`);
  $("#completionRateText").text(`${completionRate}%`);
  $("#avgGrade").css("width", `${avgGrade}%`);
  $("#avgGradeText").text(`${avgGrade}%`);
  $("#satisfactionScore").css("width", `${satisfaction}%`);
  $("#satisfactionText").text(`${satisfaction}%`);
}

// Edit course
function editCourse() {
  $("#editTitle").val(currentCourse.title);
  $("#editDescription").val(currentCourse.description);
  $("#editDuration").val(currentCourse.duration);
  $("#editPrice").val(currentCourse.price);
  $("#editImage").val(currentCourse.image);
  $("#editCourseModal").modal("show");
}

// Save course edit
function saveCourseEdit() {
  currentCourse.title = $("#editTitle").val();
  currentCourse.description = $("#editDescription").val();
  currentCourse.duration = $("#editDuration").val();
  currentCourse.price = parseFloat($("#editPrice").val());
  currentCourse.image = $("#editImage").val();
  currentCourse.updatedDate = new Date().toISOString();

  // Update in localStorage
  const allCourses = JSON.parse(localStorage.getItem("admin_courses") || "[]");
  const index = allCourses.findIndex((c) => c.id === currentCourse.id);
  if (index !== -1) {
    allCourses[index] = currentCourse;
    localStorage.setItem("admin_courses", JSON.stringify(allCourses));
  }

  renderCourseDetails();
  $("#editCourseModal").modal("hide");
  showToast("Success", "Course updated successfully!", "success");
}

// Delete course
function deleteCourse() {
  if (
    confirm(
      "Are you sure you want to delete this course? This action cannot be undone!",
    )
  ) {
    const allCourses = JSON.parse(
      localStorage.getItem("admin_courses") || "[]",
    );
    const filtered = allCourses.filter((c) => c.id !== currentCourse.id);
    localStorage.setItem("admin_courses", JSON.stringify(filtered));
    showToast("Deleted", "Course has been deleted", "success");
    setTimeout(() => (window.location.href = "courses.html"), 1500);
  }
}

// Add lesson
function addLesson() {
  const lessonName = prompt("Enter lesson name:");
  if (lessonName) {
    if (!currentCourse.curriculum) currentCourse.curriculum = [];
    currentCourse.curriculum.push(lessonName);
    renderCurriculum();
    $("#totalLessons").text(currentCourse.curriculum.length);
    showToast("Success", "Lesson added successfully!", "success");
  }
}

// Edit lesson
function editLesson(index) {
  const newName = prompt("Edit lesson name:", currentCourse.curriculum[index]);
  if (newName) {
    currentCourse.curriculum[index] = newName;
    renderCurriculum();
    showToast("Success", "Lesson updated!", "success");
  }
}

// Remove lesson
function removeLesson(index) {
  if (confirm("Remove this lesson?")) {
    currentCourse.curriculum.splice(index, 1);
    renderCurriculum();
    $("#totalLessons").text(currentCourse.curriculum.length);
    showToast("Success", "Lesson removed!", "success");
  }
}

// Add student
function addStudent() {
  const studentEmail = prompt("Enter student email to enroll:");
  if (studentEmail) {
    showToast(
      "Success",
      `Student ${studentEmail} has been enrolled!`,
      "success",
    );
    loadEnrolledStudents();
    $("#totalStudents").text(parseInt($("#totalStudents").text()) + 1);
  }
}

// Remove student
function removeStudent(studentId) {
  if (confirm("Remove this student from the course?")) {
    showToast("Removed", "Student has been removed from the course", "info");
    loadEnrolledStudents();
    $("#totalStudents").text(parseInt($("#totalStudents").text()) - 1);
  }
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
  loadCourseData();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
