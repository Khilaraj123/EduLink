let currentUser = null;
let currentCourse = null;
let enrolledStudents = [];
let courseReviews = [];

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

// Get course ID from URL
function getCourseId() {
  const urlParams = new URLSearchParams(window.location.search);
  return parseInt(urlParams.get("id"));
}

// Load course data
async function loadCourseData() {
  const courseId = getCourseId();
  if (!courseId) {
    window.location.href = "my-courses.html";
    return;
  }

  try {
    // Load courses
    const coursesResponse = await fetch("../../data/courses.json");
    const coursesData = await coursesResponse.json();
    currentCourse = coursesData.courses.find(
      (c) => c.id === courseId && c.instructorId === currentUser.id,
    );

    if (!currentCourse) {
      showToast(
        "Error",
        "Course not found or you do not have permission",
        "danger",
      );
      setTimeout(() => (window.location.href = "my-courses.html"), 2000);
      return;
    }

    // Load users for student info
    const usersResponse = await fetch("../../data/users.json");
    const usersData = await usersResponse.json();

    // Simulate enrolled students
    const allStudents = usersData.users.filter((u) => u.role === "student");
    enrolledStudents = allStudents.slice(
      0,
      Math.min(currentCourse.students || 5, allStudents.length),
    );

    // Load reviews from localStorage
    loadReviews();

    renderCourseDetails();
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
  $("#courseDuration").text(currentCourse.duration);
  $("#coursePrice").text(`$${currentCourse.price}`);
  $("#courseIdDisplay").text(currentCourse.id);
  $("#createdDate").text(currentCourse.createdDate || "2024-01-15");
  $("#updatedDate").text(currentCourse.updatedDate || "2024-02-01");
  $("#totalStudents").text(currentCourse.students || 0);
  $("#courseRating").text(currentCourse.rating || 4.5);
  $("#totalLessons").text(currentCourse.curriculum?.length || 0);

  // Calculate earnings
  const earnings = (
    currentCourse.price * (currentCourse.students || 0)
  ).toLocaleString();
  $("#totalEarnings").text("$" + earnings);

  // Render curriculum
  renderCurriculum();

  // Render enrolled students
  renderStudents();

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
                            <i class="fas fa-play-circle text-success me-2"></i>
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

// Render enrolled students
function renderStudents() {
  if (enrolledStudents.length === 0) {
    $("#studentsList").html(
      '<p class="text-muted text-center">No students enrolled yet</p>',
    );
    return;
  }

  let html = "";
  enrolledStudents.forEach((student) => {
    const progress = 0;
    html += `
                    <div class="student-item">
                        <div class="d-flex align-items-center">
                            <img src="${escapeHtml(student.avatar) || "https://randomuser.me/api/portraits/men/1.jpg"}" 
                                 class="student-avatar" alt="${escapeHtml(student.name)}">
                            <div>
                                <strong>${escapeHtml(student.name)}</strong>
                                <br>
                                <small class="text-muted">${escapeHtml(student.email)}</small>
                                <div class="progress mt-1" style="width: 100px;">
                                    <div class="progress-bar bg-success" style="width: ${progress}%"></div>
                                </div>
                                <small>${progress}% complete</small>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-danger" onclick="removeStudent(${student.id})">
                            <i class="fas fa-user-minus"></i>
                        </button>
                    </div>
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
                                <strong>${escapeHtml(review.userName)}</strong>
                                <div class="rating-stars">
                                    ${generateStarRating(review.rating)}
                                </div>
                            </div>
                            <small class="text-muted">${escapeHtml(review.date)}</small>
                        </div>
                        <p class="mt-2 mb-0">${escapeHtml(review.comment)}</p>
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
  // Simulated metrics based on students
  const completionRate =
    enrolledStudents.length > 0 ? Math.floor(Math.random() * 40) + 50 : 0;
  const avgGrade =
    enrolledStudents.length > 0 ? Math.floor(Math.random() * 30) + 60 : 0;
  const satisfaction =
    courseReviews.length > 0
      ? (courseReviews.reduce((sum, r) => sum + r.rating, 0) /
          courseReviews.length) *
        20
      : 75;

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
  const savedCourses = JSON.parse(
    localStorage.getItem(`instructor_courses_${currentUser.id}`) || "[]",
  );
  const index = savedCourses.findIndex((c) => c.id === currentCourse.id);
  if (index !== -1) {
    savedCourses[index] = currentCourse;
    localStorage.setItem(
      `instructor_courses_${currentUser.id}`,
      JSON.stringify(savedCourses),
    );
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
    const savedCourses = JSON.parse(
      localStorage.getItem(`instructor_courses_${currentUser.id}`) || "[]",
    );
    const filtered = savedCourses.filter((c) => c.id !== currentCourse.id);
    localStorage.setItem(
      `instructor_courses_${currentUser.id}`,
      JSON.stringify(filtered),
    );
    showToast("Deleted", "Course has been deleted", "success");
    setTimeout(() => (window.location.href = "my-courses.html"), 1500);
  }
}

// Create classroom
function createClassroom() {
  window.location.href = `classrooms.html?courseId=${currentCourse.id}`;
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

// Invite students
function inviteStudents() {
  const email = prompt("Enter student email to invite:");
  if (email) {
    showToast("Invitation Sent", `Invitation sent to ${email}`, "success");
  }
}

// Remove student
function removeStudent(studentId) {
  if (confirm("Remove this student from the course?")) {
    enrolledStudents = enrolledStudents.filter((s) => s.id !== studentId);
    currentCourse.students = enrolledStudents.length;
    renderStudents();
    $("#totalStudents").text(currentCourse.students);
    showToast("Removed", "Student has been removed from the course", "info");
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
      `<i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(currentUser.name)}`,
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
  loadCourseData();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
