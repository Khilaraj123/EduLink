let currentUser = null;
let classrooms = [];
let currentClassroom = null;
let assignments = [];
let discussions = [];

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

// Load classrooms data
async function loadClassrooms() {
  try {
    const response = await fetch("../../data/classrooms.json");
    const data = await response.json();

    // Filter classrooms where student is enrolled
    classrooms = data.classrooms
      .filter((classroom) => classroom.students.includes(currentUser.id))
      .map((classroom) => ({
        ...classroom,
        course: null,
      }));

    // Load course details for each classroom
    const coursesResponse = await fetch("../../data/courses.json");
    const coursesData = await coursesResponse.json();

    classrooms.forEach((classroom) => {
      const course = coursesData.courses.find(
        (c) => c.id === classroom.courseId,
      );
      if (course) {
        classroom.course = course;
      }
    });

    renderClassrooms();
    updateUpcomingDeadlines();
  } catch (error) {
    console.error("Error loading classrooms:", error);
    $("#classroomsContainer").html(`
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h4>Error Loading Classrooms</h4>
                        <p>Please try again later.</p>
                    </div>
                `);
  }
}

// Render classrooms
function renderClassrooms() {
  if (classrooms.length === 0) {
    $("#classroomsContainer").html(`
                    <div class="empty-state">
                        <i class="fas fa-chalkboard"></i>
                        <h4>No Classrooms Yet</h4>
                        <p>You haven't been added to any classrooms yet.</p>
                        <a href="courses.html" class="btn btn-primary">Enroll in a Course</a>
                    </div>
                `);
    return;
  }

  let html = '<div class="row">';
  classrooms.forEach((classroom) => {
    const assignmentCount = classroom.assignments?.length || 0;
    const pendingAssignments =
      classroom.assignments?.filter((a) => !a.submitted).length || 0;

    html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card classroom-card">
                            <div class="classroom-header">
                                <div class="classroom-icon">
                                    <i class="fas fa-chalkboard-teacher"></i>
                                </div>
                                <h5 class="mb-1">${escapeHtml(classroom.name)}</h5>
                                <p class="mb-0 small">${escapeHtml(classroom.course?.title) || "Course"}</p>
                                <div class="stats-badge">
                                    <i class="fas fa-users"></i> ${classroom.students.length} Students
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="row text-center mb-3">
                                    <div class="col-6">
                                        <h6 class="mb-0">${assignmentCount}</h6>
                                        <small class="text-muted">Assignments</small>
                                    </div>
                                    <div class="col-6">
                                        <h6 class="mb-0 text-warning">${pendingAssignments}</h6>
                                        <small class="text-muted">Pending</small>
                                    </div>
                                </div>
                                <button class="btn btn-primary w-100" onclick="openClassroom(${classroom.id})">
                                    <i class="fas fa-door-open"></i> Enter Classroom
                                </button>
                            </div>
                        </div>
                    </div>
                `;
  });
  html += "</div>";

  $("#classroomsContainer").html(html);
}

// Open classroom detail
function openClassroom(classroomId) {
  currentClassroom = classrooms.find((c) => c.id === classroomId);
  if (!currentClassroom) return;

  $("#classroomModalTitle").html(`
                <i class="fas fa-chalkboard"></i> ${escapeHtml(currentClassroom.name)}
                <small class="text-light">${escapeHtml(currentClassroom.course?.title)}</small>
            `);

  loadAnnouncements();
  loadAssignments();
  loadResources();
  loadDiscussions();

  $("#classroomModal").modal("show");
}

// Load announcements
function loadAnnouncements() {
  const announcements = [
    {
      id: 1,
      title: "Welcome to the Classroom!",
      content:
        "Welcome everyone! I hope you're excited about this course. Please review the syllabus and course materials.",
      date: "2024-01-15",
      author: "Prof. Smith",
    },
    {
      id: 2,
      title: "Office Hours",
      content:
        "I will be holding office hours every Wednesday from 2-4 PM. Feel free to drop in with questions!",
      date: "2024-01-20",
      author: "Prof. Smith",
    },
    {
      id: 3,
      title: "Project Submission Guidelines",
      content:
        "Please ensure you follow the submission guidelines for the final project. Late submissions will incur penalties.",
      date: "2024-02-01",
      author: "Teaching Assistant",
    },
  ];

  let html = "";
  announcements.forEach((announcement) => {
    html += `
                    <div class="announcement-item">
                        <div class="d-flex">
                            <div class="announcement-icon">
                                <i class="fas fa-bullhorn"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${escapeHtml(announcement.title)}</h6>
                                <p class="mb-1">${escapeHtml(announcement.content)}</p>
                                <small class="text-muted">
                                    <i class="fas fa-user"></i> ${escapeHtml(announcement.author)} | 
                                    <i class="fas fa-calendar"></i> ${escapeHtml(announcement.date)}
                                </small>
                            </div>
                        </div>
                    </div>
                `;
  });

  $("#announcementsContent").html(
    html || '<p class="text-muted">No announcements yet.</p>',
  );
}

// Load assignments
function loadAssignments() {
  const classroomAssignments = currentClassroom.assignments || [];

  if (classroomAssignments.length === 0) {
    $("#assignmentsContent").html(`
                    <div class="empty-state">
                        <i class="fas fa-tasks"></i>
                        <h4>No Assignments Yet</h4>
                        <p>Check back later for new assignments.</p>
                    </div>
                `);
    return;
  }

  let html = "";
  classroomAssignments.forEach((assignment) => {
    const statusClass = assignment.submitted ? "success" : "warning";
    const statusText = assignment.submitted ? "Submitted" : "Pending";
    const gradeHtml = assignment.grade
      ? `<span class="badge bg-info">Grade: ${assignment.grade}%</span>`
      : "";

    html += `
                    <div class="assignment-item">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${escapeHtml(assignment.title)}</h6>
                                <small class="text-muted">
                                    <i class="fas fa-calendar-alt"></i> Due: ${escapeHtml(assignment.dueDate)}
                                </small>
                                <div class="mt-2">
                                    <span class="badge bg-${statusClass}">${statusText}</span>
                                    ${gradeHtml}
                                </div>
                            </div>
                            ${
                              !assignment.submitted
                                ? `
                                <button class="btn btn-sm btn-primary" onclick="showSubmitAssignmentModal(${assignment.id}, '${escapeHtml(assignment.title)}')">
                                    <i class="fas fa-upload"></i> Submit
                                </button>
                            `
                                : ""
                            }
                        </div>
                    </div>
                `;
  });

  $("#assignmentsContent").html(html);
}

// Load resources
function loadResources() {
  const resources = [
    {
      name: "Course Syllabus",
      type: "PDF",
      size: "2.5 MB",
      icon: "fa-file-pdf",
      color: "danger",
    },
    {
      name: "Lecture Slides - Week 1",
      type: "PPTX",
      size: "5.1 MB",
      icon: "fa-file-powerpoint",
      color: "warning",
    },
    {
      name: "Code Examples",
      type: "ZIP",
      size: "1.2 MB",
      icon: "fa-file-archive",
      color: "secondary",
    },
    {
      name: "Reading Materials",
      type: "PDF",
      size: "3.7 MB",
      icon: "fa-file-pdf",
      color: "danger",
    },
    {
      name: "Video Tutorials Link",
      type: "LINK",
      size: "-",
      icon: "fa-video",
      color: "info",
    },
  ];

  let html = "";
  resources.forEach((resource) => {
    html += `
                    <div class="resource-item">
                        <div class="d-flex align-items-center">
                            <div class="resource-icon">
                                <i class="fas ${resource.icon} fa-2x text-${resource.color}"></i>
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <h6 class="mb-0">${resource.name}</h6>
                                <small class="text-muted">${resource.type} • ${resource.size}</small>
                            </div>
                            <button class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-download"></i> Download
                            </button>
                        </div>
                    </div>
                `;
  });

  $("#resourcesContent").html(html);
}

// Load discussions
function loadDiscussions() {
  const savedDiscussions = localStorage.getItem(
    `discussions_${currentClassroom.id}`,
  );
  if (savedDiscussions) {
    discussions = JSON.parse(savedDiscussions);
  } else {
    discussions = [
      {
        id: 1,
        topic: "Question about assignment 1",
        message:
          "I'm having trouble understanding the requirements for the first assignment. Can someone help?",
        author: "John Student",
        authorId: 1,
        date: "2024-02-10",
        replies: [
          {
            id: 1,
            message:
              "Check the resources section, there's a helpful guide there!",
            author: "Prof. Smith",
            authorId: 2,
            date: "2024-02-11",
          },
        ],
      },
    ];
    saveDiscussions();
  }

  let html = `
                <div class="mb-3">
                    <button class="btn btn-primary" onclick="showDiscussionModal()">
                        <i class="fas fa-plus"></i> Start New Discussion
                    </button>
                </div>
            `;

  if (discussions.length === 0) {
    html +=
      '<p class="text-muted">No discussions yet. Start the first one!</p>';
  } else {
    discussions.forEach((discussion) => {
      html += `
                        <div class="discussion-item">
                            <div class="d-flex">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-user-circle fa-2x text-secondary"></i>
                                </div>
                                <div class="flex-grow-1 ms-3">
                                    <h6 class="mb-1">${escapeHtml(discussion.topic)}</h6>
                                    <p class="mb-1">${escapeHtml(discussion.message)}</p>
                                    <small class="text-muted">
                                        <i class="fas fa-user"></i> ${escapeHtml(discussion.author)} | 
                                        <i class="fas fa-calendar"></i> ${escapeHtml(discussion.date)}
                                    </small>
                                    <div class="mt-2">
                                        <button class="btn btn-sm btn-link" onclick="toggleReplies(${discussion.id})">
                                            <i class="fas fa-comment"></i> ${discussion.replies.length} Replies
                                        </button>
                                        <button class="btn btn-sm btn-link" onclick="showReplyModal(${discussion.id})">
                                            <i class="fas fa-reply"></i> Reply
                                        </button>
                                    </div>
                                    <div id="replies-${discussion.id}" style="display: none;">
                                        ${discussion.replies
                                          .map(
                                            (reply) => `
                                            <div class="reply-item">
                                                <strong>${escapeHtml(reply.author)}</strong>
                                                <p class="mb-0">${escapeHtml(reply.message)}</p>
                                                <small class="text-muted">${escapeHtml(reply.date)}</small>
                                            </div>
                                        `,
                                          )
                                          .join("")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
    });
  }

  $("#discussionsContent").html(html);
}

// Toggle replies visibility
function toggleReplies(discussionId) {
  const repliesDiv = $(`#replies-${discussionId}`);
  if (repliesDiv.is(":visible")) {
    repliesDiv.hide();
  } else {
    repliesDiv.show();
  }
}

// Show submit assignment modal
let currentAssignmentId = null;

function showSubmitAssignmentModal(assignmentId, title) {
  currentAssignmentId = assignmentId;
  $("#assignmentTitle").val(title);
  $("#assignmentWork").val("");
  $("#attachmentLink").val("");
  $("#submitAssignmentModal").modal("show");
}

// Submit assignment
function submitAssignment() {
  const work = $("#assignmentWork").val();
  if (!work) {
    showToast("Error", "Please describe your work", "danger");
    return;
  }

  // Update assignment status
  const assignment = currentClassroom.assignments.find(
    (a) => a.id === currentAssignmentId,
  );
  if (assignment) {
    assignment.submitted = true;
    assignment.submissionDate = new Date().toISOString();
    assignment.work = work;

    // Save to localStorage
    const allClassrooms = JSON.parse(
      localStorage.getItem("classrooms") || "{}",
    );
    // Update logic here

    showToast("Success", "Assignment submitted successfully!", "success");
    $("#submitAssignmentModal").modal("hide");
    loadAssignments(); // Refresh assignments
  }
}

// Show discussion modal
function showDiscussionModal() {
  $("#discussionTopic").val("");
  $("#discussionMessage").val("");
  $("#discussionModal").modal("show");
}

// Add discussion
function addDiscussion() {
  const topic = $("#discussionTopic").val();
  const message = $("#discussionMessage").val();

  if (!topic || !message) {
    showToast("Error", "Please fill all fields", "danger");
    return;
  }

  const newDiscussion = {
    id: discussions.length + 1,
    topic: topic,
    message: message,
    author: currentUser.name,
    authorId: currentUser.id,
    date: new Date().toISOString().split("T")[0],
    replies: [],
  };

  discussions.push(newDiscussion);
  saveDiscussions();
  loadDiscussions();

  $("#discussionModal").modal("hide");
  showToast("Success", "Discussion posted!", "success");
}

// Save discussions to localStorage
function saveDiscussions() {
  localStorage.setItem(
    `discussions_${currentClassroom.id}`,
    JSON.stringify(discussions),
  );
}

// Update upcoming deadlines
function updateUpcomingDeadlines() {
  let allAssignments = [];
  classrooms.forEach((classroom) => {
    if (classroom.assignments) {
      classroom.assignments.forEach((assignment) => {
        if (!assignment.submitted) {
          allAssignments.push({
            ...assignment,
            classroomName: classroom.name,
            dueDate: assignment.dueDate,
          });
        }
      });
    }
  });

  allAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const upcoming = allAssignments.slice(0, 3);

  if (upcoming.length === 0) {
    $("#upcomingDeadlines").html("<small>No pending deadlines! 🎉</small>");
    return;
  }

  let html = "";
  upcoming.forEach((assignment) => {
    const daysLeft = Math.ceil(
      (new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24),
    );
    html += `
                    <small class="d-block mb-2">
                        <strong>${escapeHtml(assignment.title)}</strong><br>
                        ${escapeHtml(assignment.classroomName)}<br>
                        Due: ${escapeHtml(assignment.dueDate)} (${daysLeft} days left)
                    </small>
                `;
  });

  $("#upcomingDeadlines").html(html);
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

// Load user profile
function loadUserProfile() {
  if (currentUser) {
    $("#userWelcome").html(
      `<i class="fas fa-user-circle"></i> ${escapeHtml(currentUser.name)}`,
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
  loadUserProfile();
  loadClassrooms();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
