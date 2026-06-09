let currentUser = null;
let classroomData = null;
let currentCourse = null;
let studentsList = [];
let assignments = [];
let resources = [];
let announcements = [];
let discussions = [];
let currentGradingData = null;

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

    // Load users
    const usersResponse = await fetch("../../data/users.json");
    const usersData = await usersResponse.json();
    studentsList = usersData.users.filter((u) =>
      classroomData.students.includes(u.id),
    );

    // Load data from localStorage
    loadLocalData();

    renderClassroomDetails();
    updateStatistics();
  } catch (error) {
    console.error("Error loading classroom data:", error);
    showToast("Error", "Failed to load classroom data", "danger");
  }
}

// Load data from localStorage
function loadLocalData() {
  const savedAssignments = localStorage.getItem(
    `classroom_assignments_${classroomData.id}`,
  );
  assignments = savedAssignments
    ? JSON.parse(savedAssignments)
    : classroomData.assignments || [];

  const savedResources = localStorage.getItem(
    `classroom_resources_${classroomData.id}`,
  );
  resources = savedResources
    ? JSON.parse(savedResources)
    : [
        {
          id: 1,
          title: "Course Syllabus",
          type: "PDF",
          url: "#",
          description: "Complete course syllabus and guidelines",
        },
        {
          id: 2,
          title: "Lecture Slides Week 1",
          type: "PDF",
          url: "#",
          description: "Introduction to the course",
        },
      ];

  const savedAnnouncements = localStorage.getItem(
    `classroom_announcements_${classroomData.id}`,
  );
  announcements = savedAnnouncements
    ? JSON.parse(savedAnnouncements)
    : [
        {
          id: 1,
          title: "Welcome to the Classroom!",
          content: "Welcome everyone! I hope you're excited about this course.",
          date: new Date().toISOString(),
          author: currentUser.name,
        },
      ];

  const savedDiscussions = localStorage.getItem(
    `classroom_discussions_${classroomData.id}`,
  );
  discussions = savedDiscussions ? JSON.parse(savedDiscussions) : [];
}

// Save data to localStorage
function saveAssignments() {
  localStorage.setItem(
    `classroom_assignments_${classroomData.id}`,
    JSON.stringify(assignments),
  );
}

function saveResources() {
  localStorage.setItem(
    `classroom_resources_${classroomData.id}`,
    JSON.stringify(resources),
  );
}

function saveAnnouncements() {
  localStorage.setItem(
    `classroom_announcements_${classroomData.id}`,
    JSON.stringify(announcements),
  );
}

function saveDiscussions() {
  localStorage.setItem(
    `classroom_discussions_${classroomData.id}`,
    JSON.stringify(discussions),
  );
}

// Render classroom details
function renderClassroomDetails() {
  $("#classroomName").text(classroomData.name);
  $("#classroomDescription").text(
    classroomData.description || "No description provided",
  );
  $("#courseInfo").html(
    `<i class="fas fa-book"></i> ${currentCourse?.title || "Unknown Course"}`,
  );
  $("#createdDate").text(
    new Date(classroomData.createdDate || Date.now()).toLocaleDateString(),
  );

  renderStudentsList();
  renderAssignments();
  renderResources();
  renderAnnouncements();
  renderDiscussions();
}

// Render students list
function renderStudentsList() {
  if (studentsList.length === 0) {
    $("#studentsList").html(
      '<p class="text-muted text-center">No students enrolled yet</p>',
    );
    return;
  }

  let html = "";
  studentsList.forEach((student) => {
    const submissionRate = calculateStudentSubmissionRate(student.id);
    html += `
                    <div class="student-item">
                        <div class="d-flex align-items-center">
                            <img src="${student.avatar || "https://randomuser.me/api/portraits/men/1.jpg"}" 
                                 class="student-avatar" alt="${student.name}">
                            <div>
                                <strong>${student.name}</strong>
                                <br>
                                <small class="text-muted">${student.email}</small>
                                <br>
                                <small class="text-success">Enrolled: ${student.joinDate || "N/A"}</small>
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
    $("#assignmentsList").html(
      '<p class="text-muted text-center">No assignments created yet</p>',
    );
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
    const gradedCount = submissions.filter((s) => s.graded).length;

    html += `
                    <div class="assignment-item">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${assignment.title}</h6>
                                <p class="mb-1 small">${assignment.description}</p>
                                <div class="mb-2">
                                    <span class="badge bg-secondary">Due: ${new Date(assignment.dueDate).toLocaleString()}</span>
                                    <span class="badge bg-info">Max Score: ${assignment.maxPoints}</span>
                                </div>
                                <div class="progress mb-2" style="height: 5px;">
                                    <div class="progress-bar bg-success" style="width: ${submissionRate}%"></div>
                                </div>
                                <small>${submittedCount}/${studentsList.length} submitted | ${gradedCount} graded</small>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewSubmissions(${assignment.id})">
                                    <i class="fas fa-eye"></i> View
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

// Render resources
function renderResources() {
  if (resources.length === 0) {
    $("#resourcesList").html(
      '<p class="text-muted text-center">No resources added yet</p>',
    );
    return;
  }

  let html = "";
  resources.forEach((resource) => {
    html += `
                    <div class="resource-item" onclick="window.open('${resource.url}', '_blank')">
                        <div class="d-flex align-items-center">
                            <i class="fas ${getResourceIcon(resource.type)} fa-2x text-success me-3"></i>
                            <div class="flex-grow-1">
                                <strong>${resource.title}</strong>
                                <br>
                                <small class="text-muted">${resource.type} • ${resource.description || ""}</small>
                            </div>
                            <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteResource(${resource.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
  });
  $("#resourcesList").html(html);
}

// Render announcements
function renderAnnouncements() {
  if (announcements.length === 0) {
    $("#announcementsList").html(
      '<p class="text-muted text-center">No announcements yet</p>',
    );
    return;
  }

  let html = "";
  announcements
    .slice()
    .reverse()
    .forEach((announcement) => {
      html += `
                    <div class="announcement-item">
                        <h6 class="mb-1">${announcement.title}</h6>
                        <p class="mb-1">${announcement.content}</p>
                        <small class="text-muted">
                            <i class="fas fa-user"></i> ${announcement.author} • 
                            <i class="fas fa-calendar"></i> ${new Date(announcement.date).toLocaleString()}
                        </small>
                        <button class="btn btn-sm btn-link text-danger float-end" onclick="deleteAnnouncement(${announcement.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
    });
  $("#announcementsList").html(html);
}

// Render discussions
function renderDiscussions() {
  if (discussions.length === 0) {
    $("#discussionsList").html(
      '<p class="text-muted text-center">No discussions yet. Start one!</p>',
    );
    return;
  }

  let html = "";
  discussions.forEach((discussion) => {
    html += `
                    <div class="discussion-item">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>${discussion.title}</strong>
                                <br>
                                <small class="text-muted">
                                    <i class="fas fa-user"></i> ${discussion.author} • 
                                    <i class="fas fa-calendar"></i> ${new Date(discussion.date).toLocaleString()}
                                </small>
                            </div>
                            <button class="btn btn-sm btn-outline-success" onclick="replyToDiscussion(${discussion.id})">
                                <i class="fas fa-reply"></i> Reply
                            </button>
                        </div>
                        <p class="mt-2 mb-2">${discussion.content}</p>
                        <div class="replies">
                            ${renderReplies(discussion.replies || [])}
                        </div>
                    </div>
                `;
  });
  $("#discussionsList").html(html);
}

// Render replies
function renderReplies(replies) {
  if (replies.length === 0) return "";
  let html = '<hr><small class="text-muted">Replies:</small>';
  replies.forEach((reply) => {
    html += `
                    <div class="mt-2 ps-3 border-start">
                        <strong>${reply.author}</strong>
                        <small class="text-muted"> • ${new Date(reply.date).toLocaleString()}</small>
                        <p class="mb-0 small">${reply.content}</p>
                    </div>
                `;
  });
  return html;
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
  const saved = localStorage.getItem(
    `submissions_${classroomData.id}_${studentId}`,
  );
  return saved ? JSON.parse(saved) : [];
}

// Get assignment submissions
function getAssignmentSubmissions(assignmentId) {
  const submissions = [];
  studentsList.forEach((student) => {
    const studentSubmissions = getStudentSubmissions(student.id);
    const submission = studentSubmissions.find(
      (s) => s.assignmentId === assignmentId,
    );
    submissions.push({
      ...(submission || { submitted: false, graded: false }),
      studentName: student.name,
      studentId: student.id,
    });
  });
  return submissions;
}

// Update statistics
function updateStatistics() {
  $("#totalStudents").text(studentsList.length);
  $("#totalAssignments").text(assignments.length);

  let totalSubmissions = 0;
  let totalPoints = 0;
  let gradedCount = 0;

  studentsList.forEach((student) => {
    const submissions = getStudentSubmissions(student.id);
    totalSubmissions += submissions.filter((s) => s.submitted).length;
    submissions.forEach((s) => {
      if (s.graded && s.score) {
        totalPoints += s.score;
        gradedCount++;
      }
    });
  });

  const totalPossible = studentsList.length * assignments.length;
  const submissionRate =
    totalPossible > 0
      ? Math.round((totalSubmissions / totalPossible) * 100)
      : 0;
  const avgGrade = gradedCount > 0 ? Math.round(totalPoints / gradedCount) : 0;

  $("#submissionRate").text(`${submissionRate}%`);
  $("#avgGrade").text(`${avgGrade}%`);
}

// Get resource icon
function getResourceIcon(type) {
  switch (type) {
    case "PDF":
      return "fa-file-pdf";
    case "Video":
      return "fa-video";
    case "Link":
      return "fa-link";
    default:
      return "fa-file";
  }
}

// Add assignment
function addAssignment() {
  $("#assignmentForm")[0].reset();
  $("#assignmentModal").modal("show");
}

// Save assignment
function saveAssignment() {
  const newAssignment = {
    id: Date.now(),
    title: $("#assignmentTitle").val(),
    description: $("#assignmentDescription").val(),
    dueDate: $("#assignmentDueDate").val(),
    maxPoints: parseInt($("#assignmentMaxPoints").val()),
  };

  assignments.push(newAssignment);
  saveAssignments();
  renderAssignments();
  updateStatistics();
  $("#assignmentModal").modal("hide");
  showToast("Success", "Assignment created successfully!", "success");
}

// Delete assignment
function deleteAssignment(assignmentId) {
  if (confirm("Delete this assignment?")) {
    assignments = assignments.filter((a) => a.id !== assignmentId);
    saveAssignments();
    renderAssignments();
    updateStatistics();
    showToast("Deleted", "Assignment removed", "info");
  }
}

// View submissions
function viewSubmissions(assignmentId) {
  const assignment = assignments.find((a) => a.id === assignmentId);
  const submissions = getAssignmentSubmissions(assignmentId);

  let message = `Submissions for "${assignment.title}":\n\n`;
  submissions.forEach((sub) => {
    const status = sub.submitted
      ? sub.graded
        ? `Graded: ${sub.score}/${assignment.maxPoints}`
        : "Submitted (pending)"
      : "Not submitted";
    message += `${sub.studentName}: ${status}\n`;
    if (sub.feedback) message += `  Feedback: ${sub.feedback}\n`;
  });

  alert(message);

  // Offer to grade pending submissions
  const pending = submissions.filter((s) => s.submitted && !s.graded);
  if (
    pending.length > 0 &&
    confirm(`Grade ${pending.length} pending submission(s)?`)
  ) {
    gradeSubmission(pending[0].studentId, assignmentId);
  }
}

// Grade submission
function gradeSubmission(studentId, assignmentId) {
  const student = studentsList.find((s) => s.id === studentId);
  const assignment = assignments.find((a) => a.id === assignmentId);

  currentGradingData = { studentId, assignmentId };
  $("#gradeStudentName").text(student?.name);
  $("#gradeAssignmentTitle").text(assignment?.title);
  $("#gradeMaxPoints").text(assignment?.maxPoints);
  $("#gradeScore").val("");
  $("#gradeFeedback").val("");
  $("#gradeModal").modal("show");
}

// Submit grade
function submitGrade() {
  const score = parseInt($("#gradeScore").val());
  const feedback = $("#gradeFeedback").val();
  const assignment = assignments.find(
    (a) => a.id === currentGradingData.assignmentId,
  );

  if (score > assignment.maxPoints) {
    showToast("Error", `Score cannot exceed ${assignment.maxPoints}`, "danger");
    return;
  }

  const submissions = getStudentSubmissions(currentGradingData.studentId);
  const submission = submissions.find(
    (s) => s.assignmentId === currentGradingData.assignmentId,
  );

  if (submission) {
    submission.graded = true;
    submission.score = score;
    submission.feedback = feedback;
    localStorage.setItem(
      `submissions_${classroomData.id}_${currentGradingData.studentId}`,
      JSON.stringify(submissions),
    );

    $("#gradeModal").modal("hide");
    updateStatistics();
    showToast("Success", "Grade submitted!", "success");
  }
}

// Add resource
function addResource() {
  $("#resourceForm")[0].reset();
  $("#resourceModal").modal("show");
}

// Save resource
function saveResource() {
  const newResource = {
    id: Date.now(),
    title: $("#resourceTitle").val(),
    type: $("#resourceType").val(),
    url: $("#resourceUrl").val(),
    description: $("#resourceDescription").val(),
  };

  resources.push(newResource);
  saveResources();
  renderResources();
  $("#resourceModal").modal("hide");
  showToast("Success", "Resource added!", "success");
}

// Delete resource
function deleteResource(resourceId) {
  if (confirm("Delete this resource?")) {
    resources = resources.filter((r) => r.id !== resourceId);
    saveResources();
    renderResources();
    showToast("Deleted", "Resource removed", "info");
  }
}

// Make announcement
function makeAnnouncement() {
  $("#announcementForm")[0].reset();
  $("#announcementModal").modal("show");
}

// Post announcement
function postAnnouncement() {
  const newAnnouncement = {
    id: Date.now(),
    title: $("#announcementTitle").val(),
    content: $("#announcementContent").val(),
    date: new Date().toISOString(),
    author: currentUser.name,
  };

  announcements.push(newAnnouncement);
  saveAnnouncements();
  renderAnnouncements();
  $("#announcementModal").modal("hide");
  showToast("Success", "Announcement posted!", "success");
}

// Delete announcement
function deleteAnnouncement(announcementId) {
  if (confirm("Delete this announcement?")) {
    announcements = announcements.filter((a) => a.id !== announcementId);
    saveAnnouncements();
    renderAnnouncements();
    showToast("Deleted", "Announcement removed", "info");
  }
}

// Start discussion
function startDiscussion() {
  const title = prompt("Discussion title:");
  if (!title) return;
  const content = prompt("Discussion content:");
  if (!content) return;

  const newDiscussion = {
    id: Date.now(),
    title: title,
    content: content,
    author: currentUser.name,
    date: new Date().toISOString(),
    replies: [],
  };

  discussions.push(newDiscussion);
  saveDiscussions();
  renderDiscussions();
  showToast("Success", "Discussion started!", "success");
}

// Reply to discussion
function replyToDiscussion(discussionId) {
  const reply = prompt("Your reply:");
  if (!reply) return;

  const discussion = discussions.find((d) => d.id === discussionId);
  if (discussion) {
    if (!discussion.replies) discussion.replies = [];
    discussion.replies.push({
      id: Date.now(),
      content: reply,
      author: currentUser.name,
      date: new Date().toISOString(),
    });
    saveDiscussions();
    renderDiscussions();
    showToast("Success", "Reply posted!", "success");
  }
}

// Remove student
function removeStudent(studentId) {
  if (confirm("Remove this student from the classroom?")) {
    studentsList = studentsList.filter((s) => s.id !== studentId);
    classroomData.students = studentsList.map((s) => s.id);
    renderStudentsList();
    updateStatistics();
    showToast("Removed", "Student has been removed", "info");
  }
}

// Edit classroom
function editClassroom() {
  const newName = prompt("Enter new classroom name:", classroomData.name);
  if (newName) {
    classroomData.name = newName;
    const newDesc = prompt(
      "Enter new description:",
      classroomData.description || "",
    );
    classroomData.description = newDesc;
    renderClassroomDetails();
    showToast("Success", "Classroom updated!", "success");
  }
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
      `<i class="fas fa-chalkboard-teacher"></i> ${currentUser.name}`,
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
  loadClassroomData();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
