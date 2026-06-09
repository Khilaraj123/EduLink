let currentUser = null;
let allPosts = [];
let visiblePosts = 5;
let currentReplyPostId = null;
let currentCommentId = null;

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

// Load posts data
async function loadPosts() {
  try {
    const savedPosts = localStorage.getItem("community_posts");
    if (savedPosts) {
      allPosts = JSON.parse(savedPosts);
    } else {
      // Load from JSON and add instructor posts
      const response = await fetch("../../data/questions.json");
      const data = await response.json();

      allPosts = data.questions.map((q) => ({
        id: q.id,
        title: q.title,
        content: q.content,
        author: q.userName,
        authorId: q.userId,
        authorRole: "student",
        authorAvatar: `https://randomuser.me/api/portraits/${q.userId % 2 === 0 ? "men" : "women"}/${q.userId}.jpg`,
        category: "Q&A",
        date: q.date,
        upvotes: Math.floor(Math.random() * 50) + 1,
        comments: q.answers.map((a) => ({
          id: a.id,
          content: a.content,
          author: a.userName,
          authorId: a.userId,
          authorRole: a.userId === 2 ? "instructor" : "student",
          date: a.date,
          upvotes: a.upvotes,
          replies: [],
        })),
        bookmarks: 0,
      }));

      // Add instructor sample posts
      addInstructorSamplePosts();
      savePosts();
    }

    updateStats();
    renderPosts();
  } catch (error) {
    console.error("Error loading posts:", error);
    addInstructorSamplePosts();
    renderPosts();
  }
}

// Add instructor sample posts
function addInstructorSamplePosts() {
  const instructorPosts = [
    {
      id: 1001,
      title: "📢 Important: Upcoming Assignment Deadline",
      content:
        "Just a reminder that the final project deadline is approaching on March 15th. Please submit your work on time. Late submissions will incur a 10% penalty per day.",
      author: currentUser?.name || "Prof. Smith",
      authorId: currentUser?.id || 2,
      authorRole: "instructor",
      authorAvatar:
        currentUser?.avatar || "https://randomuser.me/api/portraits/men/2.jpg",
      category: "Announcement",
      date: new Date().toISOString(),
      upvotes: 45,
      comments: [],
      bookmarks: 12,
    },
    {
      id: 1002,
      title: "💡 Teaching Tip: Effective Online Engagement",
      content:
        "Here's a tip I've found useful: Use breakout rooms for group discussions and follow up with a quick poll. It keeps students engaged and provides valuable feedback!",
      author: currentUser?.name || "Prof. Smith",
      authorId: currentUser?.id || 2,
      authorRole: "instructor",
      authorAvatar:
        currentUser?.avatar || "https://randomuser.me/api/portraits/men/2.jpg",
      category: "Tip",
      date: new Date().toISOString(),
      upvotes: 89,
      comments: [],
      bookmarks: 34,
    },
    {
      id: 1003,
      title: "📚 Free Resource: Web Development Guide",
      content:
        "I've compiled a comprehensive guide to web development resources. Includes links to free tutorials, documentation, and practice projects. Check it out!",
      author: currentUser?.name || "Prof. Smith",
      authorId: currentUser?.id || 2,
      authorRole: "instructor",
      authorAvatar:
        currentUser?.avatar || "https://randomuser.me/api/portraits/men/2.jpg",
      category: "Resource",
      date: new Date().toISOString(),
      upvotes: 156,
      comments: [],
      bookmarks: 67,
    },
  ];

  allPosts = [...instructorPosts, ...allPosts];
  savePosts();
}

// Save posts to localStorage
function savePosts() {
  localStorage.setItem("community_posts", JSON.stringify(allPosts));
}

// Render posts
function renderPosts() {
  const searchTerm = $("#searchPosts").val().toLowerCase();
  const categoryFilter = $("#categoryFilter").val();
  const sortFilter = $("#sortFilter").val();

  let filteredPosts = [...allPosts];

  // Apply search filter
  if (searchTerm) {
    filteredPosts = filteredPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.author.toLowerCase().includes(searchTerm),
    );
  }

  // Apply category filter
  if (categoryFilter !== "all") {
    filteredPosts = filteredPosts.filter(
      (post) => post.category === categoryFilter,
    );
  }

  // Apply sort
  switch (sortFilter) {
    case "recent":
      filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case "popular":
      filteredPosts.sort((a, b) => b.upvotes - a.upvotes);
      break;
    case "trending":
      filteredPosts.sort(
        (a, b) =>
          b.upvotes +
          b.comments.length * 2 -
          (a.upvotes + a.comments.length * 2),
      );
      break;
  }

  const visiblePostsArray = filteredPosts.slice(0, visiblePosts);
  const hasMore = filteredPosts.length > visiblePosts;

  if (visiblePostsArray.length === 0) {
    $("#postsContainer").html(`
                    <div class="empty-state">
                        <i class="fas fa-comments"></i>
                        <h4>No posts found</h4>
                        <p>Be the first to start a discussion!</p>
                    </div>
                `);
    $("#loadMoreBtn").hide();
    return;
  }

  let html = "";
  visiblePostsArray.forEach((post) => {
    const isUpvoted = localStorage.getItem(`upvoted_${post.id}`) === "true";
    const isBookmarked =
      localStorage.getItem(`bookmarked_${post.id}`) === "true";
    const categoryIcon = getCategoryIcon(post.category);

    html += `
                    <div class="post-card" id="post-${post.id}">
                        <div class="post-header">
                            <img src="${post.authorAvatar}" class="avatar" alt="${post.author}">
                            <div class="post-meta">
                                <div class="post-title">
                                    ${escapeHtml(post.title)}
                                    <span class="badge-category">${categoryIcon} ${post.category}</span>
                                    ${post.authorRole === "instructor" ? '<span class="badge-instructor"><i class="fas fa-check-circle"></i> Instructor</span>' : ""}
                                </div>
                                <small class="text-muted">
                                    <i class="fas fa-user"></i> ${post.author} • 
                                    <i class="fas fa-calendar"></i> ${formatDate(post.date)}
                                </small>
                            </div>
                        </div>
                        <div class="post-content">
                            ${escapeHtml(post.content)}
                        </div>
                        <div class="post-stats">
                            <div class="stat-item" onclick="toggleUpvote(${post.id})">
                                <i class="fas fa-heart ${isUpvoted ? "upvoted" : ""}"></i> 
                                <span id="upvotes-${post.id}">${post.upvotes}</span> Upvotes
                            </div>
                            <div class="stat-item" onclick="toggleBookmark(${post.id})">
                                <i class="fas fa-bookmark ${isBookmarked ? "bookmarked" : ""}"></i> 
                                <span id="bookmarks-${post.id}">${post.bookmarks}</span> Bookmarks
                            </div>
                            <div class="stat-item" onclick="scrollToComments(${post.id})">
                                <i class="fas fa-comment"></i> 
                                <span id="comments-count-${post.id}">${post.comments.length}</span> Comments
                            </div>
                            <div class="stat-item" onclick="sharePost(${post.id})">
                                <i class="fas fa-share"></i> Share
                            </div>
                        </div>
                        <div class="comment-section" id="comments-${post.id}">
                            ${renderComments(post.comments, post.id)}
                            <div class="mt-2">
                                <button class="btn btn-sm btn-outline-success" onclick="showReplyModal(${post.id})">
                                    <i class="fas fa-reply"></i> Add Comment
                                </button>
                            </div>
                        </div>
                    </div>
                `;
  });

  $("#postsContainer").html(html);
  $("#loadMoreBtn").toggle(hasMore);
}

// Get category icon
function getCategoryIcon(category) {
  switch (category) {
    case "Announcement":
      return "📢";
    case "Discussion":
      return "💬";
    case "Resource":
      return "📚";
    case "Q&A":
      return "❓";
    case "Tip":
      return "💡";
    default:
      return "📝";
  }
}

// Render comments
function renderComments(comments, postId) {
  if (comments.length === 0) {
    return '<p class="text-muted">No comments yet. Be the first to comment!</p>';
  }

  let html = "";
  comments.forEach((comment) => {
    html += `
                    <div class="comment">
                        <img src="https://randomuser.me/api/portraits/${comment.authorId % 2 === 0 ? "men" : "women"}/${comment.authorId}.jpg" 
                             class="avatar-sm" alt="${comment.author}">
                        <div class="comment-content">
                            <div class="comment-author">
                                ${comment.author}
                                ${comment.authorRole === "instructor" ? '<span class="badge-instructor"><i class="fas fa-check-circle"></i> Instructor</span>' : ""}
                            </div>
                            <div class="comment-text">${escapeHtml(comment.content)}</div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="comment-time">${formatDate(comment.date)}</small>
                                <span class="reply-btn" onclick="showReplyToCommentModal(${postId}, ${comment.id})">
                                    <i class="fas fa-reply"></i> Reply
                                </span>
                            </div>
                            ${comment.replies && comment.replies.length > 0 ? renderReplies(comment.replies) : ""}
                        </div>
                    </div>
                `;
  });
  return html;
}

// Render replies
function renderReplies(replies) {
  let html = '<div class="replies">';
  replies.forEach((reply) => {
    html += `
                    <div class="reply">
                        <strong>${reply.author}</strong>
                        ${reply.authorRole === "instructor" ? '<span class="badge-instructor"><i class="fas fa-check-circle"></i></span>' : ""}
                        <p class="mb-0 small">${escapeHtml(reply.content)}</p>
                        <small class="text-muted">${formatDate(reply.date)}</small>
                    </div>
                `;
  });
  html += "</div>";
  return html;
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

// Toggle upvote
function toggleUpvote(postId) {
  const post = allPosts.find((p) => p.id === postId);
  if (post) {
    const isUpvoted = localStorage.getItem(`upvoted_${postId}`) === "true";
    if (isUpvoted) {
      post.upvotes--;
      localStorage.removeItem(`upvoted_${postId}`);
      showToast("Removed Upvote", "You removed your upvote", "info");
    } else {
      post.upvotes++;
      localStorage.setItem(`upvoted_${postId}`, "true");
      showToast("Upvoted!", "Thanks for your support!", "success");
    }
    savePosts();
    $(`#upvotes-${postId}`).text(post.upvotes);
    $(`#post-${postId} .fa-heart`).toggleClass("upvoted");
  }
}

// Toggle bookmark
function toggleBookmark(postId) {
  const post = allPosts.find((p) => p.id === postId);
  if (post) {
    const isBookmarked =
      localStorage.getItem(`bookmarked_${postId}`) === "true";
    if (isBookmarked) {
      post.bookmarks--;
      localStorage.removeItem(`bookmarked_${postId}`);
      showToast("Removed Bookmark", "Post removed from bookmarks", "info");
    } else {
      post.bookmarks++;
      localStorage.setItem(`bookmarked_${postId}`, "true");
      showToast("Bookmarked!", "Post saved to your bookmarks", "success");
    }
    savePosts();
    $(`#bookmarks-${postId}`).text(post.bookmarks);
    $(`#post-${postId} .fa-bookmark`).toggleClass("bookmarked");
  }
}

// Scroll to comments
function scrollToComments(postId) {
  const element = document.getElementById(`comments-${postId}`);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Share post
function sharePost(postId) {
  const post = allPosts.find((p) => p.id === postId);
  if (post) {
    navigator.clipboard.writeText(`Check out this post: ${post.title}`);
    showToast("Copied!", "Link copied to clipboard", "success");
  }
}

// Show reply modal
function showReplyModal(postId) {
  currentReplyPostId = postId;
  currentCommentId = null;
  $("#replyContent").val("");
  $("#replyModal").modal("show");
}

// Show reply to comment modal
function showReplyToCommentModal(postId, commentId) {
  currentReplyPostId = postId;
  currentCommentId = commentId;
  $("#replyContent").val("");
  $("#replyModal").modal("show");
}

// Submit reply
function submitReply() {
  const content = $("#replyContent").val();
  if (!content) {
    showToast("Error", "Please enter your reply", "danger");
    return;
  }

  const post = allPosts.find((p) => p.id === currentReplyPostId);
  if (post) {
    const reply = {
      id: Date.now(),
      content: content,
      author: currentUser.name,
      authorId: currentUser.id,
      authorRole: "instructor",
      date: new Date().toISOString(),
    };

    if (currentCommentId) {
      const comment = post.comments.find((c) => c.id === currentCommentId);
      if (comment) {
        if (!comment.replies) comment.replies = [];
        comment.replies.push(reply);
        showToast("Reply Posted!", "Your reply has been added", "success");
      }
    } else {
      const newComment = {
        id: Date.now(),
        content: content,
        author: currentUser.name,
        authorId: currentUser.id,
        authorRole: "instructor",
        date: new Date().toISOString(),
        upvotes: 0,
        replies: [],
      };
      post.comments.push(newComment);
      showToast("Comment Posted!", "Your comment has been added", "success");
    }

    savePosts();
    renderPosts();
    $("#replyModal").modal("hide");
  }
}

// Create new post
function createPost(title, category, content) {
  const newPost = {
    id: Date.now(),
    title: title,
    content: content,
    author: currentUser.name,
    authorId: currentUser.id,
    authorRole: "instructor",
    authorAvatar:
      currentUser.avatar ||
      `https://randomuser.me/api/portraits/${currentUser.id % 2 === 0 ? "men" : "women"}/${currentUser.id}.jpg`,
    category: category,
    date: new Date().toISOString(),
    upvotes: 0,
    comments: [],
    bookmarks: 0,
  };

  allPosts.unshift(newPost);
  savePosts();
  renderPosts();
  showToast("Post Created!", "Your post has been published", "success");
}

// Load more posts
function loadMorePosts() {
  visiblePosts += 5;
  renderPosts();
}

// Refresh posts
function refreshPosts() {
  visiblePosts = 5;
  renderPosts();
  showToast("Refreshed", "Posts have been refreshed", "info");
}

// Update statistics
function updateStats() {
  $("#totalMembers").text(Math.floor(Math.random() * 500) + 200);
  $("#totalPosts").text(allPosts.length);
  $("#activeToday").text(Math.floor(Math.random() * 100) + 50);

  // Trending tags
  const tags = [
    "JavaScript",
    "React",
    "Python",
    "Career Advice",
    "Projects",
    "Teaching Tips",
  ];
  let tagsHtml = "";
  tags.forEach((tag) => {
    tagsHtml += `<span class="trending-tag" onclick="searchByTag('${tag}')">#${tag}</span>`;
  });
  $("#trendingTags").html(tagsHtml);
}

// Search by tag
function searchByTag(tag) {
  $("#searchPosts").val(tag);
  renderPosts();
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

// Load instructor profile
function loadInstructorProfile() {
  if (currentUser) {
    $("#instructorWelcome").html(
      `<i class="fas fa-chalkboard-teacher"></i> Welcome, ${currentUser.name.split(" ")[0]}`,
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
  loadPosts();

  $("#createPostForm").on("submit", function (e) {
    e.preventDefault();
    const title = $("#postTitle").val();
    const category = $("#postCategory").val();
    const content = $("#postContent").val();

    if (title && content) {
      createPost(title, category, content);
      this.reset();
    } else {
      showToast("Error", "Please fill all fields", "danger");
    }
  });

  $("#searchPosts, #categoryFilter, #sortFilter").on(
    "input change",
    function () {
      visiblePosts = 5;
      renderPosts();
    },
  );

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
