let currentUser = null;
let classroomData = null;
let currentCourse = null;
let currentInstructor = null;
let studentsList = [];
let assignments = [];

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

// Get classroom ID from URL
function getClassroomId() {
  const urlParams = new URLSearchParams(window.location.search);
  return parseInt(urlParams.get("id"));
}

// Load classroom data
async function loadClassroomData() {
  const classroomId = getClassroomId();
  if (!classroomId) {
    window.location.href = "classrooms.html";
    return;
  }

  try {
    // Load classrooms
    const classroomsResponse = await fetch("../../data/classrooms.json");
    const classroomsData = await classroomsResponse.json();
    classroomData = classroomsData.classrooms.find((c) => c.id === classroomId);

    if (!classroomData) {
      showToast("Error", "Classroom not found", "danger");
      setTimeout(() => (window.location.href = "classrooms.html"), 2000);
      return;
    }

    // Load courses
    const coursesResponse = await fetch("../../data/courses.json");
    const coursesData = await coursesResponse.json();
    currentCourse = coursesData.courses.find(
      (c) => c.id === classroomData.courseId,
    );

    // Load users to get instructor and student info
    const usersResponse = await fetch("../../data/users.json");
    const usersData = await usersResponse.json();
    currentInstructor = usersData.users.find(
      (u) => u.id === classroomData.instructorId,
    );

    // Get student details
    studentsList = usersData.users.filter((u) =>
      classroomData.students.includes(u.id),
    );

    // Load assignments from localStorage or use default
    loadAssignments();

    renderClassroomDetails();
    updateStatistics();
    loadRecentActivity();
  } catch (error) {
    console.error("Error loading classroom data:", error);
    showToast("Error", "Failed to load classroom data", "danger");
  }
}

// Load assignments
function loadAssignments() {
  const savedAssignments = localStorage.getItem(
    `classroom_assignments_${classroomData.id}`,
  );
  if (savedAssignments) {
    assignments = JSON.parse(savedAssignments);
  } else {
    assignments = classroomData.assignments || [];
    saveAssignments();
  }
}

// Save assignments
function saveAssignments() {
  localStorage.setItem(
    `classroom_assignments_${classroomData.id}`,
    JSON.stringify(assignments),
  );
}

// Render classroom details
function renderClassroomDetails() {
  // Classroom header
  $("#classroomName").text(classroomData.name);
  $("#classroomDescription").text(
    classroomData.description || "No description provided",
  );
  $("#courseInfo").html(
    `<i class="fas fa-book"></i> ${currentCourse?.title || "Unknown Course"}`,
  );
  $("#instructorName").text(currentInstructor?.name || "Unknown Instructor");

  // Course information
  if (currentCourse) {
    $("#courseTitle").text(currentCourse.title);
    $("#courseDescription").text(currentCourse.description);
    $("#courseDuration").text(currentCourse.duration);
    $("#courseLevel").html(
      `<span class="badge bg-${getLevelColor(currentCourse.level)}">${currentCourse.level}</span>`,
    );
    $("#coursePrice").text(`$${currentCourse.price}`);
  }

  // Render students list
  renderStudentsList();

  // Render assignments
  renderAssignments();
}

// Render students list
function renderStudentsList() {
  if (studentsList.length === 0) {
    $("#studentsList").html(`
                    <div class="text-center py-3 text-muted">
                        <i class="fas fa-user-graduate fa-3x mb-2"></i>
                        <p>No students enrolled yet</p>
                        <button class="btn btn-sm btn-primary" onclick="addStudent()">Add Student</button>
                    </div>
                `);
    return;
  }

  let html = "";
  studentsList.forEach((student) => {
    const submissionRate = calculateStudentSubmissionRate(student.id);
    html += `
                    <div class="student-item">
                        <div class="d-flex align-items-center">
                            <img src="${escapeHtml(student.avatar) || "https://randomuser.me/api/portraits/men/1.jpg"}" 
                                 class="student-avatar" alt="${escapeHtml(student.name)}">
                            <div>
                                <strong>${escapeHtml(student.name)}</strong>
                                <br>
                                <small class="text-muted">${escapeHtml(student.email)}</small>
                                <br>
                                <small class="text-success">Joined: ${escapeHtml(student.joinDate) || "N/A"}</small>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="mb-1">
                                <span class="badge bg-info">Submission: ${submissionRate}%</span>
                            </div>
                            <button class="btn btn-sm btn-outline-danger" onclick="removeStudent(${student.id})">
                                <i class="fas fa-user-minus"></i> Remove
                            </button>
                        </div>
                    </div>
                `;
  });
  $("#studentsList").html(html);
}

// Render assignments
function renderAssignments() {
  if (assignments.length === 0) {
    $("#assignmentsList").html(`
                    <div class="text-center py-3 text-muted">
                        <i class="fas fa-tasks fa-3x mb-2"></i>
                        <p>No assignments created yet</p>
                        <button class="btn btn-sm btn-primary" onclick="addAssignment()">Create Assignment</button>
                    </div>
                `);
    return;
  }

  let html = "";
  assignments.forEach((assignment) => {
    const submissions = getAssignmentSubmissions(assignment.id);
    const submittedCount = submissions.filter((s) => s.submitted).length;
    const submissionRate = (
      (submittedCount / studentsList.length) *
      100
    ).toFixed(0);

    html += `
                    <div class="assignment-item">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${escapeHtml(assignment.title)}</h6>
                                <p class="mb-1 small">${escapeHtml(assignment.description) || "No description"}</p>
                                <div class="mb-2">
                                    <span class="badge bg-secondary">Due: ${escapeHtml(assignment.dueDate)}</span>
                                    <span class="badge bg-info">Max Score: ${assignment.maxScore}</span>
                                </div>
                                <div class="progress mb-2" style="height: 5px;">
                                    <div class="progress-bar bg-success" style="width: ${submissionRate}%"></div>
                                </div>
                                <small>${submittedCount}/${studentsList.length} students submitted (${submissionRate}%)</small>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewSubmissions(${assignment.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteAssignment(${assignment.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
  });
  $("#assignmentsList").html(html);
}

// Calculate student submission rate
function calculateStudentSubmissionRate(studentId) {
  const submissions = getStudentSubmissions(studentId);
  const submittedCount = submissions.filter((s) => s.submitted).length;
  return assignments.length > 0
    ? Math.round((submittedCount / assignments.length) * 100)
    : 0;
}

// Get student submissions
function getStudentSubmissions(studentId) {
  const savedSubmissions = localStorage.getItem(
    `submissions_${classroomData.id}_${studentId}`,
  );
  return savedSubmissions ? JSON.parse(savedSubmissions) : [];
}

// Get assignment submissions
function getAssignmentSubmissions(assignmentId) {
  const submissions = [];
  studentsList.forEach((student) => {
    const studentSubmissions = getStudentSubmissions(student.id);
    const submission = studentSubmissions.find(
      (s) => s.assignmentId === assignmentId,
    );
    if (submission) {
      submissions.push({
        ...submission,
        studentName: student.name,
        studentId: student.id,
      });
    } else {
      submissions.push({
        assignmentId,
        studentId: student.id,
        studentName: student.name,
        submitted: false,
      });
    }
  });
  return submissions;
}

// Update statistics
function updateStatistics() {
  $("#totalStudents").text(studentsList.length);
  $("#totalAssignments").text(assignments.length);

  // Calculate submission rate
  let totalSubmissions = 0;
  let totalPossible = studentsList.length * assignments.length;
  studentsList.forEach((student) => {
    const submissions = getStudentSubmissions(student.id);
    totalSubmissions += submissions.filter((s) => s.submitted).length;
  });
  const submissionRate =
    totalPossible > 0
      ? Math.round((totalSubmissions / totalPossible) * 100)
      : 0;
  $("#submissionRate").text(`${submissionRate}%`);

  // Calculate average grade
  let totalGrade = 0;
  let gradedCount = 0;
  studentsList.forEach((student) => {
    const submissions = getStudentSubmissions(student.id);
    submissions.forEach((sub) => {
      if (sub.graded && sub.score) {
        totalGrade += sub.score;
        gradedCount++;
      }
    });
  });
  const avgGrade = gradedCount > 0 ? Math.round(totalGrade / gradedCount) : 0;
  $("#avgGrade").text(`${avgGrade}%`);
}

// Load recent activity
function loadRecentActivity() {
  const activities = [
    {
      type: "assignment",
      action: "Assignment added",
      title: "JavaScript Basics Quiz",
      date: "2024-02-15",
      user: "Admin",
    },
    {
      type: "student",
      action: "Student enrolled",
      title: "John Doe joined the classroom",
      date: "2024-02-14",
      user: "System",
    },
    {
      type: "submission",
      action: "Assignment submitted",
      title: "HTML/CSS Project",
      date: "2024-02-13",
      user: "Sarah Johnson",
    },
  ];

  let html = "";
  activities.forEach((activity) => {
    html += `
                    <div class="timeline-item">
                        <div class="timeline-date">${escapeHtml(activity.date)}</div>
                        <div class="mb-1">
                            <i class="fas ${getActivityIcon(activity.type)}"></i>
                            <strong>${escapeHtml(activity.action)}</strong>
                        </div>
                        <div class="small text-muted">${escapeHtml(activity.title)}</div>
                        <div class="small text-muted">by ${escapeHtml(activity.user)}</div>
                    </div>
                `;
  });
  $("#recentActivity").html(html);
}

// Get activity icon
function getActivityIcon(type) {
  switch (type) {
    case "assignment":
      return "fa-tasks";
    case "student":
      return "fa-user-plus";
    case "submission":
      return "fa-upload";
    default:
      return "fa-bell";
  }
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

// Edit classroom
function editClassroom() {
  $("#editClassName").val(classroomData.name);
  $("#editClassDescription").val(classroomData.description || "");
  $("#editClassroomModal").modal("show");
}

// Save classroom edit
function saveClassroomEdit() {
  classroomData.name = $("#editClassName").val();
  classroomData.description = $("#editClassDescription").val();

  // Save to localStorage or update JSON (simulated)
  localStorage.setItem(
    `classroom_${classroomData.id}`,
    JSON.stringify(classroomData),
  );
  renderClassroomDetails();
  $("#editClassroomModal").modal("hide");
  showToast("Success", "Classroom updated successfully!", "success");
}

// Delete classroom
function deleteClassroom() {
  if (
    confirm(
      "Are you sure you want to delete this classroom? This action cannot be undone.",
    )
  ) {
    showToast("Deleted", "Classroom has been deleted", "info");
    setTimeout(() => (window.location.href = "classrooms.html"), 1500);
  }
}

// Add student
function addStudent() {
  const studentEmail = prompt("Enter student email address:");
  if (studentEmail) {
    showToast(
      "Student Added",
      `${studentEmail} has been added to the classroom`,
      "success",
    );
    // In real implementation, you would fetch student data from users.json
  }
}

// Remove student
function removeStudent(studentId) {
  if (confirm("Are you sure you want to remove this student?")) {
    studentsList = studentsList.filter((s) => s.id !== studentId);
    classroomData.students = studentsList.map((s) => s.id);
    renderStudentsList();
    updateStatistics();
    showToast("Removed", "Student has been removed from classroom", "info");
  }
}

// Add assignment
function addAssignment() {
  $("#addAssignmentModal").modal("show");
}

// Save assignment
function saveAssignment() {
  const newAssignment = {
    id: assignments.length + 1,
    title: $("#assignmentTitle").val(),
    description: $("#assignmentDescription").val(),
    dueDate: $("#assignmentDueDate").val(),
    maxScore: parseInt($("#assignmentMaxScore").val()),
  };

  assignments.push(newAssignment);
  saveAssignments();
  renderAssignments();
  updateStatistics();
  $("#addAssignmentModal").modal("hide");
  showToast("Success", "Assignment added successfully!", "success");
}

// Delete assignment
function deleteAssignment(assignmentId) {
  if (confirm("Are you sure you want to delete this assignment?")) {
    assignments = assignments.filter((a) => a.id !== assignmentId);
    saveAssignments();
    renderAssignments();
    updateStatistics();
    showToast("Deleted", "Assignment has been deleted", "info");
  }
}

// View submissions
function viewSubmissions(assignmentId) {
  const assignment = assignments.find((a) => a.id === assignmentId);
  const submissions = getAssignmentSubmissions(assignmentId);

  let message = `Submissions for "${escapeHtml(assignment.title)}":\n\n`;
  submissions.forEach((sub) => {
    const status = sub.submitted
      ? sub.graded
        ? `Graded: ${sub.score}/${assignment.maxScore}`
        : "Submitted (pending grade)"
      : "Not submitted";
    message += `${sub.studentName}: ${status}\n`;
    if (sub.feedback) message += `  Feedback: ${sub.feedback}\n`;
  });

  alert(message);
}

// Show grade modal (simplified)
let currentGradingData = null;

function showGradeModal(studentId, assignmentId) {
  currentGradingData = { studentId, assignmentId };
  const student = studentsList.find((s) => s.id === studentId);
  const assignment = assignments.find((a) => a.id === assignmentId);

  $("#gradeStudentName").text(student?.name);
  $("#gradeAssignmentTitle").text(assignment?.title);
  $("#gradeModal").modal("show");
}

// Submit grade
function submitGrade() {
  const score = parseInt($("#gradeScore").val());
  const feedback = $("#gradeFeedback").val();

  if (currentGradingData) {
    const submissions = getStudentSubmissions(currentGradingData.studentId);
    const submission = submissions.find(
      (s) => s.assignmentId === currentGradingData.assignmentId,
    );
    if (submission) {
      submission.graded = true;
      submission.score = score;
      submission.feedback = feedback;
      saveStudentSubmissions(currentGradingData.studentId, submissions);
    }

    $("#gradeModal").modal("hide");
    updateStatistics();
    showToast("Graded", "Assignment has been graded", "success");
  }
}

// Save student submissions
function saveStudentSubmissions(studentId, submissions) {
  localStorage.setItem(
    `submissions_${classroomData.id}_${studentId}`,
    JSON.stringify(submissions),
  );
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
      `<i class="fas fa-user-shield"></i> ${escapeHtml(currentUser.name)}`,
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
  loadClassroomData();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
