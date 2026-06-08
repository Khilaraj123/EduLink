let currentUser = null;
let currentCourse = null;
let isEnrolled = false;
let courseProgress = {};
let currentLessonIndex = 0;
let currentCourseId = null;

// Check authentication
function checkAuth() {
  const user = localStorage.getItem("currentUser");
  if (!user) {
    window.location.href = "../../login.html";
    return null;
  }
  currentUser = JSON.parse(user);
  return currentUser;
}

// Get course ID from URL
function getCourseId() {
  const urlParams = new URLSearchParams(window.location.search);
  return parseInt(urlParams.get("id"));
}

// Load course data
async function loadCourse() {
  const courseId = getCourseId();
  if (!courseId) {
    window.location.href = "courses.html";
    return;
  }

  try {
    const response = await fetch("../../assets/data/courses.json");
    const data = await response.json();
    currentCourse = data.courses.find((c) => c.id === courseId);

    if (!currentCourse) {
      showToast("Error", "Course not found", "danger");
      setTimeout(() => (window.location.href = "courses.html"), 2000);
      return;
    }

    // Check if user is enrolled
    isEnrolled =
      currentUser.enrolledCourses &&
      currentUser.enrolledCourses.includes(courseId);

    // Load progress
    loadProgress();

    renderCourse();
  } catch (error) {
    console.error("Error loading course:", error);
    showToast("Error", "Failed to load course", "danger");
  }
}

// Load course progress
function loadProgress() {
  const savedProgress = localStorage.getItem(
    `course_progress_${currentUser.id}_${currentCourse.id}`,
  );
  if (savedProgress) {
    courseProgress = JSON.parse(savedProgress);
  } else {
    // Initialize progress
    courseProgress = {
      completedLessons: [],
      currentLesson: 0,
      lastAccessed: new Date().toISOString(),
    };
    saveProgress();
  }
}

// Save progress
function saveProgress() {
  localStorage.setItem(
    `course_progress_${currentUser.id}_${currentCourse.id}`,
    JSON.stringify(courseProgress),
  );
}

// Render course page
function renderCourse() {
  const progressPercent = calculateProgress();
  const completedCount = courseProgress.completedLessons.length;
  const totalLessons = currentCourse.curriculum.length;

  let html = `
                <div class="course-header">
                    <div class="container">
                        <div class="row">
                            <div class="col-md-8">
                                <h1 class="display-5 fw-bold">${currentCourse.title}</h1>
                                <p class="lead">${currentCourse.description}</p>
                                <div class="mt-3">
                                    <span class="badge bg-light text-dark me-2">
                                        <i class="fas fa-user"></i> ${currentCourse.instructorName}
                                    </span>
                                    <span class="badge bg-light text-dark me-2">
                                        <i class="fas fa-clock"></i> ${currentCourse.duration}
                                    </span>
                                    <span class="badge bg-light text-dark me-2">
                                        <i class="fas fa-signal"></i> ${currentCourse.level}
                                    </span>
                                    <span class="badge bg-light text-dark">
                                        <i class="fas fa-users"></i> ${currentCourse.students} students
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="course-content">
                    <div class="row">
                        <div class="col-md-8">
                            <!-- Course Image -->
                            <img src="${currentCourse.image}" class="course-image-large mb-4" alt="${currentCourse.title}">
                            
                            <!-- What You'll Learn -->
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h4><i class="fas fa-graduation-cap"></i> What You'll Learn</h4>
                                    <ul class="feature-list">
                                        <li><i class="fas fa-check-circle"></i> Master ${currentCourse.title} from scratch</li>
                                        <li><i class="fas fa-check-circle"></i> Build real-world projects</li>
                                        <li><i class="fas fa-check-circle"></i> Get certified upon completion</li>
                                        <li><i class="fas fa-check-circle"></i> Access to community support</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <!-- Course Curriculum -->
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h4><i class="fas fa-list"></i> Course Curriculum</h4>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between">
                                            <span>${totalLessons} lessons</span>
                                            <span>${completedCount} completed</span>
                                        </div>
                                        <div class="progress">
                                            <div class="progress-bar bg-success" style="width: ${progressPercent}%"></div>
                                        </div>
                                    </div>
                                    <div id="curriculumList">
                                        ${currentCourse.curriculum
                                          .map((lesson, index) => {
                                            const isCompleted =
                                              courseProgress.completedLessons.includes(
                                                index,
                                              );
                                            const isCurrent =
                                              courseProgress.currentLesson ===
                                              index;
                                            let statusClass = "";
                                            if (isCompleted)
                                              statusClass = "completed";
                                            if (isCurrent && isEnrolled)
                                              statusClass = "current";

                                            return `
                                                <div class="curriculum-item ${statusClass}" onclick="${isEnrolled ? `openLesson(${index})` : "showEnrollPrompt()"}">
                                                    <div class="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <span class="lesson-icon">
                                                                <i class="fas ${isCompleted ? "fa-check-circle text-success" : isCurrent ? "fa-play-circle text-warning" : "fa-file-alt"}"></i>
                                                            </span>
                                                            <strong>Lesson ${index + 1}:</strong> ${lesson}
                                                        </div>
                                                        ${isCompleted ? '<span class="badge bg-success">Completed</span>' : ""}
                                                    </div>
                                                </div>
                                            `;
                                          })
                                          .join("")}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Reviews Section -->
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h4><i class="fas fa-star"></i> Student Reviews</h4>
                                    <div id="reviewsContainer"></div>
                                    ${
                                      isEnrolled
                                        ? `
                                        <button class="btn btn-outline-primary mt-3" onclick="showReviewModal()">
                                            <i class="fas fa-edit"></i> Write a Review
                                        </button>
                                    `
                                        : ""
                                    }
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <!-- Enrollment Card -->
                            <div class="enroll-card">
                                ${
                                  isEnrolled
                                    ? `
                                    <div class="text-center">
                                        <div class="progress-circle mb-3" style="width: 80px; height: 80px;">
                                            <div class="progress-inner" style="width: 60px; height: 60px; font-size: 1rem;">
                                                ${progressPercent}%
                                            </div>
                                        </div>
                                        <h5>Your Progress</h5>
                                        <p>${completedCount} of ${totalLessons} lessons completed</p>
                                        <button class="btn btn-success w-100 mb-2" onclick="continueLearning()">
                                            <i class="fas fa-play"></i> Continue Learning
                                        </button>
                                        <button class="btn btn-outline-primary w-100" onclick="downloadCertificate()">
                                            <i class="fas fa-certificate"></i> Get Certificate
                                        </button>
                                    </div>
                                `
                                    : `
                                    <div class="text-center">
                                        <div class="price-large mb-2">$${currentCourse.price}</div>
                                        <button class="btn btn-primary btn-lg w-100 mb-3" onclick="showEnrollModal()">
                                            <i class="fas fa-shopping-cart"></i> Enroll Now
                                        </button>
                                        <small class="text-muted">30-Day Money-Back Guarantee</small>
                                        <hr>
                                        <h6>This course includes:</h6>
                                        <ul class="feature-list">
                                            <li><i class="fas fa-video"></i> ${currentCourse.duration} of video content</li>
                                            <li><i class="fas fa-download"></i> Downloadable resources</li>
                                            <li><i class="fas fa-certificate"></i> Certificate of completion</li>
                                            <li><i class="fas fa-mobile-alt"></i> Mobile access</li>
                                        </ul>
                                    </div>
                                `
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;

  $("#courseContent").html(html);

  if (isEnrolled) {
    $("#progressSidebar").show();
    updateProgressSidebar();
  }

  loadReviews();
}

// Calculate progress percentage
function calculateProgress() {
  if (!currentCourse) return 0;
  const total = currentCourse.curriculum.length;
  const completed = courseProgress.completedLessons.length;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

// Update progress sidebar
function updateProgressSidebar() {
  const progressPercent = calculateProgress();
  const completedCount = courseProgress.completedLessons.length;
  const totalLessons = currentCourse.curriculum.length;

  // Update circle progress
  const degrees = (progressPercent / 100) * 360;
  $("#progressCircle").css(
    "background",
    `conic-gradient(#28a745 ${degrees}deg, #e9ecef ${degrees}deg)`,
  );
  $("#progressPercent").text(`${progressPercent}%`);
  $("#completedLessons").text(completedCount);
  $("#totalLessons").text(totalLessons);
}

// Open lesson modal
function openLesson(index) {
  if (!isEnrolled) {
    showEnrollPrompt();
    return;
  }

  currentLessonIndex = index;
  const lesson = currentCourse.curriculum[index];
  const isCompleted = courseProgress.completedLessons.includes(index);

  $("#lessonModalTitle").text(`Lesson ${index + 1}: ${lesson}`);
  $("#lessonContent").html(`
                <div class="video-placeholder" onclick="playVideo()">
                    <i class="fas fa-play-circle fa-4x mb-3"></i>
                    <h5>Click to play video lesson</h5>
                    <p class="text-muted">${lesson} - Full video tutorial</p>
                </div>
                <div class="mt-4">
                    <h6>Lesson Description</h6>
                    <p>This lesson covers ${lesson}. You'll learn practical skills through hands-on examples and exercises.</p>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> Complete this lesson to track your progress
                    </div>
                </div>
            `);

  $("#markCompleteBtn").html(
    isCompleted
      ? '<i class="fas fa-check"></i> Completed'
      : '<i class="fas fa-check-circle"></i> Mark as Complete',
  );
  $("#markCompleteBtn").prop("disabled", isCompleted);

  $("#lessonModal").modal("show");
}

// Play video (simulated)
function playVideo() {
  showToast("Video Player", "Video would play here in production", "info");
}

// Mark lesson as complete
function markLessonComplete() {
  if (!courseProgress.completedLessons.includes(currentLessonIndex)) {
    courseProgress.completedLessons.push(currentLessonIndex);
    saveProgress();

    // Update UI
    $("#markCompleteBtn").html('<i class="fas fa-check"></i> Completed');
    $("#markCompleteBtn").prop("disabled", true);

    // Check if course is completed
    if (
      courseProgress.completedLessons.length === currentCourse.curriculum.length
    ) {
      showToast(
        "Congratulations!",
        "You have completed the course! 🎉",
        "success",
      );
      awardCertificate();
    } else {
      showToast("Lesson Completed!", "Great job! Keep going!", "success");
    }

    // Re-render course to update progress
    renderCourse();
    updateProgressSidebar();
  }
}

// Navigate between lessons
function navigateLesson(direction) {
  const newIndex = currentLessonIndex + direction;
  if (newIndex >= 0 && newIndex < currentCourse.curriculum.length) {
    openLesson(newIndex);
  } else {
    showToast("Navigation", "No more lessons in this direction", "info");
  }
}

// Continue learning from where left off
function continueLearning() {
  const nextLesson = courseProgress.currentLesson;
  openLesson(nextLesson);
}

// Award certificate
function awardCertificate() {
  const certificate = {
    courseId: currentCourse.id,
    courseTitle: currentCourse.title,
    studentName: currentUser.name,
    completionDate: new Date().toISOString(),
    certificateId: `CERT-${currentUser.id}-${currentCourse.id}-${Date.now()}`,
  };

  localStorage.setItem(
    `certificate_${currentUser.id}_${currentCourse.id}`,
    JSON.stringify(certificate),
  );
}

// Download certificate
function downloadCertificate() {
  const certificate = localStorage.getItem(
    `certificate_${currentUser.id}_${currentCourse.id}`,
  );
  if (certificate) {
    showToast(
      "Certificate",
      "Certificate would be downloaded in production",
      "success",
    );
  } else {
    showToast(
      "Certificate",
      "Complete the course first to get your certificate",
      "warning",
    );
  }
}

// Load reviews
function loadReviews() {
  const reviews = JSON.parse(
    localStorage.getItem(`reviews_${currentCourse.id}`) || "[]",
  );

  if (reviews.length === 0) {
    $("#reviewsContainer").html(
      '<p class="text-muted">No reviews yet. Be the first to review!</p>',
    );
    return;
  }

  let html = "";
  reviews.forEach((review) => {
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

  $("#reviewsContainer").html(html);
}

// Generate star rating
function generateStarRating(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += `<i class="fas fa-star${i <= rating ? "" : "-o"}"></i>`;
  }
  return stars;
}

// Show enroll modal
function showEnrollModal() {
  $("#modalCourseTitle").text(currentCourse.title);
  $("#modalCoursePrice").text(currentCourse.price);
  $("#enrollModal").modal("show");
}

// Show enroll prompt
function showEnrollPrompt() {
  showToast(
    "Enrollment Required",
    "Please enroll in this course to access lessons",
    "warning",
  );
}

// Confirm enrollment
function confirmEnroll() {
  // Add course to user's enrolled courses
  if (!currentUser.enrolledCourses) {
    currentUser.enrolledCourses = [];
  }
  currentUser.enrolledCourses.push(currentCourse.id);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // Update users.json in localStorage
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (users.users) {
    const userIndex = users.users.findIndex((u) => u.id === currentUser.id);
    if (userIndex !== -1) {
      users.users[userIndex] = currentUser;
      localStorage.setItem("users", JSON.stringify(users));
    }
  }

  isEnrolled = true;

  // Initialize progress
  courseProgress = {
    completedLessons: [],
    currentLesson: 0,
    lastAccessed: new Date().toISOString(),
  };
  saveProgress();

  $("#enrollModal").modal("hide");
  showToast("Success!", "You are now enrolled in this course!", "success");
  renderCourse();
}

// Show review modal
function showReviewModal() {
  $("#reviewRating").val(0);
  $("#reviewText").val("");
  $(".rating-input i").removeClass("fas").addClass("far");
  $("#reviewModal").modal("show");
}

// Submit review
function submitReview() {
  const rating = parseInt($("#reviewRating").val());
  const comment = $("#reviewText").val();

  if (rating === 0) {
    showToast("Error", "Please select a rating", "danger");
    return;
  }

  if (!comment) {
    showToast("Error", "Please write a review", "danger");
    return;
  }

  const reviews = JSON.parse(
    localStorage.getItem(`reviews_${currentCourse.id}`) || "[]",
  );
  reviews.push({
    userId: currentUser.id,
    userName: currentUser.name,
    rating: rating,
    comment: comment,
    date: new Date().toISOString().split("T")[0],
  });

  localStorage.setItem(`reviews_${currentCourse.id}`, JSON.stringify(reviews));
  $("#reviewModal").modal("hide");
  showToast("Thank You!", "Your review has been submitted", "success");
  loadReviews();
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

// Rating input handler
$(document).on("click", ".rating-input i", function () {
  const rating = $(this).data("rating");
  $("#reviewRating").val(rating);

  $(".rating-input i").each(function (index) {
    if (index < rating) {
      $(this).removeClass("far").addClass("fas");
    } else {
      $(this).removeClass("fas").addClass("far");
    }
  });
});

// Logout
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "../../login.html";
}

// Event listeners
$(document).ready(function () {
  checkAuth();
  loadCourse();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
