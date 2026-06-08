let currentUser = null;
let allPosts = [];
let currentFilter = "all";
let searchTerm = "";
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
  if (currentUser.role !== "student") {
    window.location.href = `../../pages/${currentUser.role}/dashboard.html`;
    return null;
  }
  return currentUser;
}

// Load posts data
async function loadPosts() {
  try {
    // Try to load from localStorage first
    const savedPosts = localStorage.getItem("community_posts");
    if (savedPosts) {
      allPosts = JSON.parse(savedPosts);
    } else {
      // Load from JSON file
      const response = await fetch("../../assets/data/questions.json");
      const data = await response.json();

      // Convert questions to posts format
      allPosts = data.questions.map((q) => ({
        id: q.id,
        title: q.title,
        content: q.content,
        author: q.userName,
        authorId: q.userId,
        authorAvatar: `https://randomuser.me/api/portraits/${q.userId % 2 === 0 ? "men" : "women"}/${q.userId}.jpg`,
        category: "Question",
        date: q.date,
        upvotes: Math.floor(Math.random() * 50) + 1,
        comments: q.answers.map((a) => ({
          id: a.id,
          content: a.content,
          author: a.userName,
          authorId: a.userId,
          date: a.date,
          upvotes: a.upvotes,
          replies: [],
        })),
        bookmarks: 0,
      }));

      // Add some sample posts if none exist
      if (allPosts.length === 0) {
        addSamplePosts();
      }

      savePosts();
    }

    updateStats();
    renderPosts();
  } catch (error) {
    console.error("Error loading posts:", error);
    addSamplePosts();
    renderPosts();
  }
}

// Add sample posts
function addSamplePosts() {
  allPosts = [
    {
      id: 1,
      title: "Tips for learning Web Development?",
      content:
        "I'm just starting my web development journey. Any tips or resources you'd recommend for beginners?",
      author: "John Doe",
      authorId: 1,
      authorAvatar: "https://randomuser.me/api/portraits/men/1.jpg",
      category: "Question",
      date: new Date().toISOString().split("T")[0],
      upvotes: 45,
      comments: [
        {
          id: 101,
          content:
            "Start with HTML, CSS, then JavaScript. FreeCodeCamp is great!",
          author: "Jane Smith",
          authorId: 2,
          date: new Date().toISOString().split("T")[0],
          upvotes: 12,
          replies: [],
        },
      ],
      bookmarks: 8,
    },
    {
      id: 2,
      title: "Free Resource: Complete Python Course",
      content:
        "I found this amazing free Python course on YouTube. It covers everything from basics to advanced topics. Check it out!",
      author: "Sarah Johnson",
      authorId: 3,
      authorAvatar: "https://randomuser.me/api/portraits/women/2.jpg",
      category: "Resource",
      date: new Date().toISOString().split("T")[0],
      upvotes: 89,
      comments: [],
      bookmarks: 23,
    },
    {
      id: 3,
      title: "My First React Project - Portfolio Site",
      content:
        "Just finished my portfolio website using React. Would love some feedback!",
      author: "Mike Brown",
      authorId: 4,
      authorAvatar: "https://randomuser.me/api/portraits/men/3.jpg",
      category: "Project",
      date: new Date().toISOString().split("T")[0],
      upvotes: 67,
      comments: [],
      bookmarks: 15,
    },
  ];
  savePosts();
}

// Save posts to localStorage
function savePosts() {
  localStorage.setItem("community_posts", JSON.stringify(allPosts));
}

// Render posts
function renderPosts() {
  let filteredPosts = [...allPosts];

  // Apply filter
  if (currentFilter === "latest") {
    filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (currentFilter === "popular") {
    filteredPosts.sort((a, b) => b.upvotes - a.upvotes);
  } else if (currentFilter === "unanswered") {
    filteredPosts = filteredPosts.filter((p) => p.comments.length === 0);
  }

  // Apply search
  if (searchTerm) {
    filteredPosts = filteredPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.author.toLowerCase().includes(searchTerm),
    );
  }

  // Limit visible posts
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

    html += `
                    <div class="post-card" id="post-${post.id}">
                        <div class="post-header">
                            <img src="${post.authorAvatar}" class="avatar" alt="${post.author}">
                            <div class="post-meta">
                                <div class="post-title">
                                    ${post.title}
                                    <span class="badge-category">${post.category}</span>
                                </div>
                                <small class="text-muted">
                                    <i class="fas fa-user"></i> ${post.author} • 
                                    <i class="fas fa-calendar"></i> ${post.date}
                                </small>
                            </div>
                        </div>
                        <div class="post-content">
                            ${post.content}
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
                                <button class="btn btn-sm btn-outline-primary" onclick="showReplyModal(${post.id})">
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
                            <div class="comment-author">${comment.author}</div>
                            <div class="comment-text">${comment.content}</div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="comment-time">${comment.date}</small>
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
                        <p class="mb-0 small">${reply.content}</p>
                        <small class="text-muted">${reply.date}</small>
                    </div>
                `;
  });
  html += "</div>";
  return html;
}

// Filter posts
function filterPosts(filter) {
  currentFilter = filter;
  visiblePosts = 5;

  // Update active button styling
  $(".btn-group .btn").removeClass("active");
  $(`.btn-group .btn[data-filter="${filter}"]`).addClass("active");

  renderPosts();
}

// Search posts
function searchPosts() {
  searchTerm = $("#searchPosts").val();
  visiblePosts = 5;
  renderPosts();
}

// Load more posts
function loadMorePosts() {
  visiblePosts += 5;
  renderPosts();
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
    const shareText = `Check out this post: ${post.title}`;
    navigator.clipboard.writeText(shareText);
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
      date: new Date().toISOString().split("T")[0],
    };

    if (currentCommentId) {
      // Reply to a comment
      const comment = post.comments.find((c) => c.id === currentCommentId);
      if (comment) {
        if (!comment.replies) comment.replies = [];
        comment.replies.push(reply);
        showToast("Reply Posted!", "Your reply has been added", "success");
      }
    } else {
      // New comment
      const newComment = {
        id: Date.now(),
        content: content,
        author: currentUser.name,
        authorId: currentUser.id,
        date: new Date().toISOString().split("T")[0],
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
    authorAvatar:
      currentUser.avatar ||
      `https://randomuser.me/api/portraits/${currentUser.id % 2 === 0 ? "men" : "women"}/${currentUser.id}.jpg`,
    category: category,
    date: new Date().toISOString().split("T")[0],
    upvotes: 0,
    comments: [],
    bookmarks: 0,
  };

  allPosts.unshift(newPost);
  savePosts();
  renderPosts();
  showToast("Post Created!", "Your post has been published", "success");
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
    "Career",
    "Projects",
    "Interview",
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
  searchPosts();
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

// Load user profile
function loadUserProfile() {
  if (currentUser) {
    $("#userWelcome").html(
      `<i class="fas fa-user-circle"></i> Welcome, ${currentUser.name.split(" ")[0]}`,
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

  $("#searchPosts").on("keypress", function (e) {
    if (e.key === "Enter") {
      searchPosts();
    }
  });

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
