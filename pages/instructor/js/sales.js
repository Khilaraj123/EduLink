let currentUser = null;
let earningsChart, courseEarningsChart;
let myCourses = [];
let allTransactions = [];
let filteredTransactions = [];
let currentPage = 1;
let itemsPerPage = 10;
const COMMISSION_RATE = 0.7; // 70% commission

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

// Load data
async function loadSalesData() {
  try {
    // Load courses
    const coursesResponse = await fetch("../../data/courses.json");
    const coursesData = await coursesResponse.json();
    myCourses = coursesData.courses.filter(
      (c) => c.instructorId === currentUser.id,
    );

    // Populate course filter
    populateCourseFilter();

    // Generate transactions for instructor's courses
    generateTransactions();

    updateSalesData();
  } catch (error) {
    console.error("Error loading sales data:", error);
    showToast("Error", "Failed to load sales data", "danger");
  }
}

// Populate course filter dropdown
function populateCourseFilter() {
  let options = '<option value="all">All Courses</option>';
  myCourses.forEach((course) => {
    options += `<option value="${course.id}">${escapeHtml(course.title)}</option>`;
  });
  $("#courseFilter").html(options);
}

// Generate transactions
function generateTransactions() {
  const savedTransactions = localStorage.getItem(
    `instructor_transactions_${currentUser.id}`,
  );
  if (savedTransactions) {
    allTransactions = JSON.parse(savedTransactions);
  } else {
    allTransactions = [];
    const students = [
      "John Doe",
      "Jane Smith",
      "Mike Johnson",
      "Sarah Williams",
      "David Brown",
    ];
    const statuses = [
      "completed",
      "completed",
      "completed",
      "pending",
      "completed",
    ];

    myCourses.forEach((course) => {
      const numSales = Math.floor(Math.random() * 50) + 10;
      for (let i = 0; i < numSales; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90));
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const student = students[Math.floor(Math.random() * students.length)];

        allTransactions.push({
          id: `TXN${String(allTransactions.length + 1).padStart(6, "0")}`,
          date: date.toISOString(),
          student: student,
          studentEmail: `${student.toLowerCase().replace(" ", ".")}@example.com`,
          courseId: course.id,
          courseTitle: course.title,
          amount: course.price,
          commission: course.price * COMMISSION_RATE,
          status: status,
        });
      }
    });

    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveTransactions();
  }
}

// Save transactions
function saveTransactions() {
  localStorage.setItem(
    `instructor_transactions_${currentUser.id}`,
    JSON.stringify(allTransactions),
  );
}

// Update sales data based on filters
function updateSalesData() {
  const days = $("#dateRange").val();
  const courseId = $("#courseFilter").val();

  let filtered = [...allTransactions];

  // Filter by date range
  if (days !== "all") {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    filtered = filtered.filter((t) => new Date(t.date) >= cutoffDate);
  }

  // Filter by course
  if (courseId !== "all") {
    filtered = filtered.filter((t) => t.courseId === parseInt(courseId));
  }

  filteredTransactions = filtered;
  calculateStats();
  updateCharts();
  updateTopCourses();
  renderTransactions();
}

// Calculate statistics
function calculateStats() {
  const completedTransactions = filteredTransactions.filter(
    (t) => t.status === "completed",
  );
  const totalEarnings = completedTransactions.reduce(
    (sum, t) => sum + t.commission,
    0,
  );
  const totalSales = completedTransactions.length;
  const totalStudents = [
    ...new Set(completedTransactions.map((t) => t.student)),
  ].length;
  const avgSaleValue = totalSales > 0 ? totalEarnings / totalSales : 0;

  // Calculate available payout (completed transactions not yet paid out)
  const paidOut = localStorage.getItem(`payout_amount_${currentUser.id}`) || 0;
  const availablePayout = totalEarnings - paidOut;

  $("#totalEarnings").text("$" + totalEarnings.toLocaleString());
  $("#totalSales").text(totalSales.toLocaleString());
  $("#totalStudents").text(totalStudents);
  $("#avgSaleValue").text("$" + avgSaleValue.toFixed(2));
  $("#availablePayout").text("$" + availablePayout.toLocaleString());

  // Update trends (simulated)
  $("#earningsTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 15 + 5).toFixed(0) +
      "%",
  );
  $("#salesTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 12 + 3).toFixed(0) +
      "%",
  );
  $("#studentsTrend").html(
    '<i class="fas fa-arrow-up"></i> +' +
      (Math.random() * 18 + 5).toFixed(0) +
      "%",
  );
}

// Update charts
function updateCharts() {
  // Earnings trend data
  const trendData = generateTrendData();

  if (earningsChart) earningsChart.destroy();
  earningsChart = new Chart(document.getElementById("earningsChart"), {
    type: "line",
    data: {
      labels: trendData.labels,
      datasets: [
        {
          label: "Earnings ($)",
          data: trendData.values,
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
      },
    },
  });

  // Course earnings distribution
  const courseData = generateCourseEarningsData();
  if (courseEarningsChart) courseEarningsChart.destroy();
  courseEarningsChart = new Chart(
    document.getElementById("courseEarningsChart"),
    {
      type: "pie",
      data: {
        labels: courseData.labels,
        datasets: [
          {
            data: courseData.values,
            backgroundColor: [
              "#28a745",
              "#ffc107",
              "#17a2b8",
              "#dc3545",
              "#6610f2",
              "#fd7e14",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    },
  );
}

// Generate trend data
function generateTrendData() {
  const monthlyEarnings = {};
  const completedTransactions = filteredTransactions.filter(
    (t) => t.status === "completed",
  );

  completedTransactions.forEach((t) => {
    const month = new Date(t.date).toLocaleString("default", {
      month: "short",
    });
    monthlyEarnings[month] = (monthlyEarnings[month] || 0) + t.commission;
  });

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const labels = months.filter((m) => monthlyEarnings[m]);
  const values = labels.map((l) => monthlyEarnings[l]);

  return { labels, values };
}

// Generate course earnings data
function generateCourseEarningsData() {
  const courseEarnings = {};
  const completedTransactions = filteredTransactions.filter(
    (t) => t.status === "completed",
  );

  completedTransactions.forEach((t) => {
    courseEarnings[t.courseTitle] =
      (courseEarnings[t.courseTitle] || 0) + t.commission;
  });

  const sorted = Object.entries(courseEarnings)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  return {
    labels: sorted.map((s) => s[0]),
    values: sorted.map((s) => s[1]),
  };
}

// Update top courses table
function updateTopCourses() {
  const courseSales = {};
  const completedTransactions = filteredTransactions.filter(
    (t) => t.status === "completed",
  );

  completedTransactions.forEach((t) => {
    if (!courseSales[t.courseId]) {
      const course = myCourses.find((c) => c.id === t.courseId);
      courseSales[t.courseId] = {
        title: t.courseTitle,
        students: 0,
        sales: 0,
        earnings: 0,
      };
    }
    courseSales[t.courseId].students++;
    courseSales[t.courseId].sales += t.amount;
    courseSales[t.courseId].earnings += t.commission;
  });

  const topCourses = Object.values(courseSales)
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);

  let html = "";
  topCourses.forEach((course, index) => {
    const performance =
      topCourses.length > 0
        ? (course.earnings / topCourses[0].earnings) * 100
        : 0;

    html += `
                    <tr>
                        <td><span class="badge bg-${index < 3 ? "warning" : "secondary"}">${index + 1}</span></td>
                        <td>${escapeHtml(course.title)}</td>
                        <td>${course.students}</td>
                        <td>$${course.sales.toLocaleString()}</td>
                        <td><strong>$${course.earnings.toLocaleString()}</strong></td>
                        <td>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar bg-success" style="width: ${performance}%"></div>
                            </div>
                            <small>${performance.toFixed(0)}%</small>
                        </td>
                    </tr>
                `;
  });

  $("#topCoursesBody").html(html);
}

// Render transactions
function renderTransactions() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageTransactions = filteredTransactions.slice(start, end);

  if (pageTransactions.length === 0) {
    $("#transactionsBody").html(
      '<tr><td colspan="7" class="text-center">No transactions found</td></tr>',
    );
    $("#transactionPagination").html("");
    return;
  }

  let html = "";
  pageTransactions.forEach((transaction) => {
    const statusClass =
      transaction.status === "completed"
        ? "status-completed"
        : "status-pending";

    html += `
                    <tr>
                        <td><code>${transaction.id}</code></td>
                        <td>${new Date(transaction.date).toLocaleDateString()}</td>
                        <td>${transaction.student}</td>
                        <td>${transaction.courseTitle}</td>
                        <td>$${transaction.amount.toFixed(2)}</td>
                        <td><strong>$${transaction.commission.toFixed(2)}</strong></td>
                        <td><span class="transaction-status ${statusClass}">${transaction.status}</span></td>
                    </tr>
                `;
  });

  $("#transactionsBody").html(html);
  renderPagination();
}

// Render pagination
function renderPagination() {
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  if (totalPages <= 1) {
    $("#transactionPagination").html("");
    return;
  }

  let html = "";
  html += `<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
                    </li>`;

  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    html += `<li class="page-item ${currentPage === i ? "active" : ""}">
                            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                         </li>`;
  }

  if (totalPages > 5) {
    html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a></li>`;
  }

  html += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
                        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
                    </li>`;

  $("#transactionPagination").html(html);
}

// Change page
function changePage(page) {
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderTransactions();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Request payout
function requestPayout() {
  const completedTransactions = filteredTransactions.filter(
    (t) => t.status === "completed",
  );
  const totalEarnings = completedTransactions.reduce(
    (sum, t) => sum + t.commission,
    0,
  );
  const paidOut = parseFloat(
    localStorage.getItem(`payout_amount_${currentUser.id}`) || 0,
  );
  const available = totalEarnings - paidOut;

  if (available <= 0) {
    showToast("No Funds", "No funds available for payout", "warning");
    return;
  }

  if (confirm(`Request payout of $${available.toLocaleString()}?`)) {
    localStorage.setItem(`payout_amount_${currentUser.id}`, totalEarnings);
    showToast(
      "Payout Requested",
      `Payout of $${available.toLocaleString()} has been requested!`,
      "success",
    );
    calculateStats();
  }
}

// Export sales report
function exportSalesReport() {
  const report = {
    instructor: currentUser.name,
    generatedDate: new Date().toISOString(),
    totalEarnings: $("#totalEarnings").text(),
    totalSales: $("#totalSales").text(),
    totalStudents: $("#totalStudents").text(),
    transactions: filteredTransactions,
  };

  const dataStr = JSON.stringify(report, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute(
    "download",
    `sales_report_${new Date().toISOString().split("T")[0]}.json`,
  );
  linkElement.click();

  showToast("Success", "Sales report exported!", "success");
}

// Export top courses to CSV
function exportTopCourses() {
  let csv = "Rank,Course Name,Students,Total Sales,Your Earnings\n";
  $("#topCoursesBody tr").each(function () {
    const row = $(this);
    csv += csvEscape(row.find("td:eq(0)").text()) + ",";
    csv += '"' + csvEscape(row.find("td:eq(1)").text()) + '",';
    csv += csvEscape(row.find("td:eq(2)").text()) + ",";
    csv += csvEscape(row.find("td:eq(3)").text()) + ",";
    csv += csvEscape(row.find("td:eq(4)").text()) + "\n";
  });

  downloadCSV(csv, "top_courses.csv");
}

// Export transactions to CSV
function exportTransactions() {
  let csv = "Transaction ID,Date,Student,Course,Amount,Commission,Status\n";
  filteredTransactions.forEach((t) => {
    csv += `${csvEscape(t.id)},${new Date(t.date).toLocaleDateString()},"${csvEscape(t.student)}","${csvEscape(t.courseTitle)}",${t.amount},${t.commission},${csvEscape(t.status)}\n`;
  });

  downloadCSV(csv, "transactions.csv");
}

// Export chart
function exportChart() {
  showToast("Info", "Chart export feature coming soon!", "info");
}

// CSV escape helper
function csvEscape(value) {
  const str = String(value);
  if (/^[=+\-@]/.test(str)) {
    return "'" + str;
  }
  return str;
}

// Download CSV
function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  showToast("Success", "CSV exported successfully!", "success");
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
  loadSalesData();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });
});
