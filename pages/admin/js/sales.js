let currentUser = null;
let revenueTrendChart, categoryChart;
let allTransactions = [];
let filteredTransactions = [];
let currentPage = 1;
let itemsPerPage = 10;
let allCourses = [];

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

// Generate sample transactions
async function generateTransactions() {
  try {
    const coursesResponse = await fetch("../../assets/data/courses.json");
    const coursesData = await coursesResponse.json();
    allCourses = coursesData.courses;

    const usersResponse = await fetch("../../assets/data/users.json");
    const usersData = await usersResponse.json();
    const students = usersData.users.filter((u) => u.role === "student");

    const savedTransactions = localStorage.getItem("sales_transactions");
    if (savedTransactions) {
      allTransactions = JSON.parse(savedTransactions);
    } else {
      // Generate random transactions
      allTransactions = [];
      const statuses = [
        "completed",
        "completed",
        "completed",
        "pending",
        "failed",
      ];

      for (let i = 0; i < 50; i++) {
        const course =
          allCourses[Math.floor(Math.random() * allCourses.length)];
        const student = students[Math.floor(Math.random() * students.length)];
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90));
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        allTransactions.push({
          id: `TXN${String(i + 1).padStart(6, "0")}`,
          date: date.toISOString(),
          customer: student.name,
          customerEmail: student.email,
          courseId: course.id,
          courseTitle: course.title,
          amount: course.price,
          status: status,
          paymentMethod: ["Credit Card", "PayPal", "Debit Card"][
            Math.floor(Math.random() * 3)
          ],
        });
      }

      // Sort by date descending
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      saveTransactions();
    }

    updateSalesData();
  } catch (error) {
    console.error("Error generating transactions:", error);
  }
}

// Save transactions
function saveTransactions() {
  localStorage.setItem("sales_transactions", JSON.stringify(allTransactions));
}

// Update sales data based on date range
function updateSalesData() {
  const days = parseInt($("#dateRange").val());
  const filtered = filterByDateRange(allTransactions, days);

  calculateStats(filtered);
  updateCharts(filtered);
  updateTopProducts(filtered);
  filterTransactions();
}

// Filter by date range
function filterByDateRange(transactions, days) {
  if (days === "all") return transactions;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return transactions.filter((t) => new Date(t.date) >= cutoffDate);
}

// Calculate statistics
function calculateStats(transactions) {
  const completedTransactions = transactions.filter(
    (t) => t.status === "completed",
  );
  const totalRevenue = completedTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );
  const totalSales = completedTransactions.length;
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Find top sales day
  const dailySales = {};
  completedTransactions.forEach((t) => {
    const date = new Date(t.date).toLocaleDateString();
    dailySales[date] = (dailySales[date] || 0) + t.amount;
  });

  let topDay = "-";
  let maxSales = 0;
  for (const [date, sales] of Object.entries(dailySales)) {
    if (sales > maxSales) {
      maxSales = sales;
      topDay = date;
    }
  }

  $("#totalRevenue").text("$" + totalRevenue.toLocaleString());
  $("#totalSales").text(totalSales.toLocaleString());
  $("#avgOrderValue").text("$" + avgOrderValue.toFixed(2));
  $("#topDay").text(topDay);

  // Update quick summary
  $("#quickSummary").html(`
                <small>Revenue: $${totalRevenue.toLocaleString()}</small><br>
                <small>Sales: ${totalSales}</small><br>
                <small>Avg Order: $${avgOrderValue.toFixed(2)}</small>
            `);
}

// Update charts
function updateCharts(transactions) {
  // Revenue trend data
  const trendData = generateTrendData(transactions);

  if (revenueTrendChart) revenueTrendChart.destroy();
  revenueTrendChart = new Chart(document.getElementById("revenueTrendChart"), {
    type: "line",
    data: {
      labels: trendData.labels,
      datasets: [
        {
          label: "Revenue ($)",
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

  // Category data
  const categoryData = generateCategoryData(transactions);
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(document.getElementById("categoryChart"), {
    type: "pie",
    data: {
      labels: categoryData.labels,
      datasets: [
        {
          data: categoryData.values,
          backgroundColor: [
            "#007bff",
            "#28a745",
            "#ffc107",
            "#dc3545",
            "#17a2b8",
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
  });
}

// Generate trend data
function generateTrendData(transactions) {
  const days = {};
  const completedTransactions = transactions.filter(
    (t) => t.status === "completed",
  );

  completedTransactions.forEach((t) => {
    const date = new Date(t.date).toLocaleDateString();
    days[date] = (days[date] || 0) + t.amount;
  });

  const sortedDates = Object.keys(days).sort();
  const labels = sortedDates.slice(-14); // Last 14 days
  const values = labels.map((label) => days[label]);

  return { labels, values };
}

// Generate category data
function generateCategoryData(transactions) {
  const categories = {
    "Web Development": 0,
    Programming: 0,
    "Data Science": 0,
    Design: 0,
    Business: 0,
  };

  const completedTransactions = transactions.filter(
    (t) => t.status === "completed",
  );
  completedTransactions.forEach((t) => {
    const course = allCourses.find((c) => c.id === t.courseId);
    if (course) {
      if (course.title.includes("Web") || course.title.includes("HTML")) {
        categories["Web Development"] += t.amount;
      } else if (
        course.title.includes("Python") ||
        course.title.includes("JavaScript")
      ) {
        categories["Programming"] += t.amount;
      } else if (
        course.title.includes("Data") ||
        course.title.includes("Analytics")
      ) {
        categories["Data Science"] += t.amount;
      } else if (course.title.includes("Design")) {
        categories["Design"] += t.amount;
      } else {
        categories["Business"] += t.amount;
      }
    }
  });

  return {
    labels: Object.keys(categories),
    values: Object.values(categories),
  };
}

// Update top products
function updateTopProducts(transactions) {
  const productSales = {};
  const completedTransactions = transactions.filter(
    (t) => t.status === "completed",
  );

  completedTransactions.forEach((t) => {
    if (!productSales[t.courseId]) {
      productSales[t.courseId] = {
        title: t.courseTitle,
        units: 0,
        revenue: 0,
      };
    }
    productSales[t.courseId].units++;
    productSales[t.courseId].revenue += t.amount;
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  let html = "";
  topProducts.forEach((product, index) => {
    const course = allCourses.find((c) => c.title === product.title);
    const performance = (product.revenue / topProducts[0].revenue) * 100;

    html += `
                    <tr>
                        <td><span class="badge bg-${index < 3 ? "warning" : "secondary"}">${index + 1}</span></td>
                        <td>${product.title}</td>
                        <td>${course?.instructorName || "Unknown"}</td>
                        <td>${product.units}</td>
                        <td><strong>$${product.revenue.toLocaleString()}</strong></td>
                        <td>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar bg-success" style="width: ${performance}%"></div>
                            </div>
                            <small>${performance.toFixed(0)}%</small>
                        </td>
                    </tr>
                `;
  });

  $("#topProductsBody").html(html);
}

// Filter transactions
function filterTransactions() {
  const statusFilter = $("#statusFilter").val();
  const searchTerm = $("#searchTransaction").val().toLowerCase();
  const days = parseInt($("#dateRange").val());

  let filtered = filterByDateRange(allTransactions, days);

  if (statusFilter !== "all") {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }

  if (searchTerm) {
    filtered = filtered.filter(
      (t) =>
        t.id.toLowerCase().includes(searchTerm) ||
        t.customer.toLowerCase().includes(searchTerm) ||
        t.courseTitle.toLowerCase().includes(searchTerm),
    );
  }

  filteredTransactions = filtered;
  currentPage = 1;
  renderTransactions();
}

// Search transactions
function searchTransactions() {
  filterTransactions();
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
    let statusClass = "";
    if (transaction.status === "completed") statusClass = "status-completed";
    else if (transaction.status === "pending") statusClass = "status-pending";
    else statusClass = "status-failed";

    html += `
                    <tr>
                        <td><code>${transaction.id}</code></td>
                        <td>${new Date(transaction.date).toLocaleDateString()}</td>
                        <td>${transaction.customer}</td>
                        <td>${transaction.courseTitle}</td>
                        <td><strong>$${transaction.amount.toFixed(2)}</strong></td>
                        <td><span class="transaction-status ${statusClass}">${transaction.status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="viewInvoice('${transaction.id}')">
                                <i class="fas fa-file-invoice"></i>
                            </button>
                        </td>
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
  }
}

// View invoice
function viewInvoice(transactionId) {
  const transaction = allTransactions.find((t) => t.id === transactionId);
  if (transaction) {
    const course = allCourses.find((c) => c.id === transaction.courseId);

    $("#invoiceContent").html(`
                    <div class="container">
                        <div class="row mb-4">
                            <div class="col-6">
                                <h5>EduLink Learning Platform</h5>
                                <p>123 Education Street<br>New York, NY 10001<br>contact@edulink.com</p>
                            </div>
                            <div class="col-6 text-end">
                                <h5>INVOICE</h5>
                                <p><strong>Invoice #:</strong> ${transaction.id}<br>
                                <strong>Date:</strong> ${new Date(transaction.date).toLocaleDateString()}<br>
                                <strong>Due Date:</strong> ${new Date(transaction.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        <div class="row mb-4">
                            <div class="col-12">
                                <h6>Bill To:</h6>
                                <p><strong>${transaction.customer}</strong><br>${transaction.customerEmail}</p>
                            </div>
                        </div>
                        
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th class="text-end">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Course: ${transaction.courseTitle}</td>
                                    <td class="text-end">$${transaction.amount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td><strong>Total</strong></td>
                                    <td class="text-end"><strong>$${transaction.amount.toFixed(2)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div class="row">
                            <div class="col-12">
                                <p class="text-muted">Payment Status: <span class="badge ${transaction.status === "completed" ? "bg-success" : "bg-warning"}">${transaction.status}</span></p>
                                <p class="text-muted">Thank you for choosing EduLink!</p>
                            </div>
                        </div>
                    </div>
                `);

    $("#invoiceModal").modal("show");
  }
}

// Print invoice
function printInvoice() {
  const printContent = $("#invoiceContent").html();
  const originalContent = document.body.innerHTML;

  document.body.innerHTML = printContent;
  window.print();
  document.body.innerHTML = originalContent;
  location.reload();
}

// Export sales report
function exportSalesReport() {
  const report = {
    generatedDate: new Date().toISOString(),
    dateRange: $("#dateRange").val(),
    totalRevenue: $("#totalRevenue").text(),
    totalSales: $("#totalSales").text(),
    averageOrderValue: $("#avgOrderValue").text(),
    transactions: filteredTransactions,
  };

  const dataStr = JSON.stringify(report, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const exportFileDefaultName = `sales_report_${new Date().toISOString().split("T")[0]}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();

  showToast("Success", "Sales report exported!", "success");
}

// Export top courses to CSV
function exportTopCourses() {
  let csv = "Rank,Course Name,Instructor,Units Sold,Revenue\n";
  $("#topProductsBody tr").each(function () {
    const row = $(this);
    csv += row.find("td:eq(0)").text() + ",";
    csv += '"' + row.find("td:eq(1)").text() + '",';
    csv += '"' + row.find("td:eq(2)").text() + '",';
    csv += row.find("td:eq(3)").text() + ",";
    csv += row.find("td:eq(4)").text() + "\n";
  });

  downloadCSV(csv, "top_courses.csv");
}

// Export transactions to CSV
function exportTransactions() {
  let csv = "Transaction ID,Date,Customer,Course,Amount,Status\n";
  filteredTransactions.forEach((t) => {
    csv += `${t.id},${new Date(t.date).toLocaleDateString()},"${t.customer}","${t.courseTitle}",${t.amount},${t.status}\n`;
  });

  downloadCSV(csv, "transactions.csv");
}

// Export chart
function exportChart(chartName) {
  showToast("Info", "Chart export feature coming soon!", "info");
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
  generateTransactions();

  $("#logoutBtn").on("click", function (e) {
    e.preventDefault();
    logout();
  });

  $("#searchTransaction").on("keypress", function (e) {
    if (e.key === "Enter") {
      searchTransactions();
    }
  });
});
