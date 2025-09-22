// API URLs
const BASE = 'localhost'; // Change to your server address if needed
const API_URLS = {
  cinemas: `http://localhost:3000/rapchieu`,
  customers: `https://67ac56315853dfff53da3fd1.mockapi.io/Khach_Hang`,
  movies: `http://localhost:3000/phim`,
  tickets: `http://localhost:3000/ve`,
  payments: `http://localhost:3000/thanhtoan`,
  // Thêm các API mới nếu có
  showtimes: `http://localhost:3000/suatchieu`, // API suất chiếu
  rooms: `http://localhost:3000/phongchieu`, // API phòng chiếu
  seats: `http://localhost:3000/ghe`, // API ghế
};

// Global data storage
const dashboardData = {
  cinemas: [],
  customers: [],
  movies: [],
  tickets: [],
  payments: [],
  showtimes: [], // Thêm dữ liệu suất chiếu
  rooms: [], // Thêm dữ liệu phòng chiếu
  seats: [], // Thêm dữ liệu ghế
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎬 Cinema Dashboard Loading...');
  await loadAllData();

  // Setup event listeners for date filtering
  document.getElementById('dateRange')?.addEventListener('change', function () {
    const selectedRange = this.value;
    console.log('Date range changed:', selectedRange);

    // Filter data based on selected range
    filterDataByDateRange(selectedRange);
  });

  // Setup event listeners cho movie revenue table
  setupMovieRevenueFilters();

  // Setup event listeners cho showtime revenue table
  setupShowtimeRevenueFilters();
});

// Toggle sidebar khi bấm nút 3 gạch
const sidebar = document.querySelector('.sidebar');
const menuToggle = document.getElementById('menuToggle');

if (menuToggle) {
  menuToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    sidebar.classList.toggle('show');
    document.body.classList.toggle('sidebar-open');
  });
}

// Ẩn sidebar khi click ra ngoài (trên mobile)
document.addEventListener('click', function (e) {
  if (
    sidebar.classList.contains('show') &&
    !sidebar.contains(e.target) &&
    !menuToggle.contains(e.target)
  ) {
    sidebar.classList.remove('show');
    document.body.classList.remove('sidebar-open');
  }
});

// Load all data from APIs
async function loadAllData() {
  try {
    console.log('📡 Loading data from APIs...');

    // Load data from all APIs (thử load thêm API mới, nếu fail thì bỏ qua)
    const apiCalls = [
      fetchData('cinemas', API_URLS.cinemas),
      fetchData('customers', API_URLS.customers),
      fetchData('movies', API_URLS.movies),
      fetchData('tickets', API_URLS.tickets),
      fetchData('payments', API_URLS.payments),
    ];

    // Thử load các API bổ sung (có thể chưa có)
    try {
      apiCalls.push(fetchData('showtimes', API_URLS.showtimes));
      apiCalls.push(fetchData('rooms', API_URLS.rooms));
      apiCalls.push(fetchData('seats', API_URLS.seats));
    } catch (error) {
      console.log('Additional APIs not available:', error);
    }

    const results = await Promise.allSettled(apiCalls);

    // Process results
    let successCount = 0;
    results.forEach((result, index) => {
      const keys = [
        'cinemas',
        'customers',
        'movies',
        'tickets',
        'payments',
        'showtimes',
        'rooms',
        'seats',
      ];
      const key = keys[index];

      if (result.status === 'fulfilled') {
        dashboardData[key] = result.value;
        successCount++;
        console.log(`✅ ${key}: ${result.value.length} items loaded`);
      } else {
        console.error(`❌ ${key} failed:`, result.reason);
        dashboardData[key] = []; // Keep empty array for failed requests
      }
    });

    console.log(
      `📊 Loaded ${successCount}/${apiCalls.length} APIs successfully`,
    );
    console.log('Final data:', dashboardData);

    // Update dashboard with loaded data
    updateDashboard();
  } catch (error) {
    console.error('💥 Error loading data:', error);
    showError('Không thể tải dữ liệu từ server');
  }
}

// Fetch data from API
async function fetchData(name, url) {
  console.log(`📡 Fetching ${name} from ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ ${name}: Loaded ${data.length} items`);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout - API không phản hồi');
    }
    throw new Error(`Không thể kết nối - ${error.message}`);
  }
}

// Update entire dashboard
function updateDashboard() {
  console.log('🔄 Updating dashboard...');
  updateStatsCards();
  updateCharts();
  updateTables();
  updateRecentTransactions();
  updatePaymentMethodStats();
  updateMovieRevenueSection(); // Bảng chi tiết doanh thu phim
  updateShowtimeRevenueSection(); // Bảng chi tiết doanh thu suất chiếu
  console.log('✅ Dashboard updated!');
}

// Update stats cards
function updateStatsCards() {
  const {tickets, payments, movies, customers} = dashboardData;

  console.log('📊 Updating stats cards...');
  console.log('Data counts:', {
    tickets: tickets.length,
    payments: payments.length,
    movies: movies.length,
    customers: customers.length,
  });

  // Calculate total revenue
  const totalRevenue = payments.reduce((sum, payment) => {
    const amount = Number.parseFloat(payment.so_tien) || 0;
    return sum + amount;
  }, 0);

  console.log('💰 Total revenue calculated:', totalRevenue);

  // Update elements with error checking
  const revenueElement = document.getElementById('totalRevenue');
  const ticketsElement = document.getElementById('totalTickets');
  const moviesElement = document.getElementById('totalMovies');
  const customersElement = document.getElementById('totalCustomers');

  if (revenueElement) revenueElement.textContent = formatCurrency(totalRevenue);
  if (ticketsElement)
    ticketsElement.textContent = tickets.length.toLocaleString();
  if (moviesElement) moviesElement.textContent = movies.length.toLocaleString();
  if (customersElement)
    customersElement.textContent = customers.length.toLocaleString();

  // Update change percentages
  const revenueChange = document.getElementById('revenueChange');
  const ticketsChange = document.getElementById('ticketsChange');
  const moviesChange = document.getElementById('moviesChange');
  const customersChange = document.getElementById('customersChange');

  if (revenueChange) revenueChange.textContent = '+12.5%';
  if (ticketsChange) ticketsChange.textContent = '+8.3%';
  if (moviesChange) moviesChange.textContent = '0%';
  if (customersChange) customersChange.textContent = '+15.2%';

  // ----------- Thống kê mới ------------

  // 1. Ghế đã bán trong tháng này
  const soldSeatsElement = document.getElementById('soldSeats');
  let soldSeats = 0;
  const now = new Date();
  payments.forEach(payment => {
    if (payment.ngay_mua) {
      const [d, m, y] = payment.ngay_mua.split('/').map(Number);
      if (y === now.getFullYear() && m === now.getMonth() + 1) {
        soldSeats++;
      }
    }
  });
  if (soldSeatsElement) soldSeatsElement.textContent = soldSeats;

  // 2. Tỷ lệ lấp đầy ghế (trong tháng này)
  const seatOccupancyElement = document.getElementById('seatOccupancy');
  let occupancy = 0;
  let totalSeats = 0;
  if (dashboardData.tickets && dashboardData.tickets.length > 0) {
    // Đếm số suất chiếu duy nhất trong tháng
    const suatChieuIds = new Set();
    tickets.forEach(ticket => {
      if (ticket.ngay_mua) {
        const [d, m, y] = ticket.ngay_mua.split('/').map(Number);
        if (
          y === now.getFullYear() &&
          m === now.getMonth() + 1 &&
          ticket.suat_chieu_id
        ) {
          suatChieuIds.add(ticket.suat_chieu_id);
        }
      }
    });
    totalSeats = suatChieuIds.size * 30;
    occupancy = totalSeats > 0 ? Math.round((soldSeats / totalSeats) * 100) : 0;
  }
  if (seatOccupancyElement) seatOccupancyElement.textContent = occupancy + '%';

  // 3. Khách hàng mới trong tháng này
  const newCustomersElement = document.getElementById('newCustomers');
  let newCustomers = 0;
  customers.forEach(cus => {
    if (cus.ngay_tao) {
      const [d, m, y] = cus.ngay_tao.split('/').map(Number);
      if (y === now.getFullYear() && m === now.getMonth() + 1) {
        newCustomers++;
      }
    }
  });
  if (newCustomersElement) newCustomersElement.textContent = newCustomers;

  // 4. Suất chiếu hôm nay
  const todayShowtimesElement = document.getElementById('todayShowtimes');
  let todayShowtimes = 0;
  const todayStr = `${now.getDate().toString().padStart(2, '0')}/${(
    now.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}/${now.getFullYear()}`;
  const suatChieuHomNay = new Set();
  tickets.forEach(ticket => {
    if (ticket.ngay_chieu === todayStr && ticket.suat_chieu_id) {
      suatChieuHomNay.add(ticket.suat_chieu_id);
    }
  });
  todayShowtimes = suatChieuHomNay.size;
  if (todayShowtimesElement) todayShowtimesElement.textContent = todayShowtimes;

  // ----------- End thống kê mới -----------

  console.log('✅ Stats cards updated!');
}

// Update charts
function updateCharts() {
  console.log('📈 Updating charts...');
  updateRevenueChart();
  updateMoviesChart();
}

// Update revenue chart
function updateRevenueChart() {
  const chartContainer = document.getElementById('revenueChart');
  const revenueData = generateRevenueByDate();

  chartContainer.innerHTML = '';

  if (revenueData.data.length === 0) {
    chartContainer.innerHTML =
      '<div class="loading-chart">Không có dữ liệu doanh thu</div>';
    return;
  }

  const maxValue = Math.max(...revenueData.data);

  revenueData.data.forEach((value, index) => {
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = `${maxValue > 0 ? (value / maxValue) * 200 : 0}px`;
    bar.title = `${revenueData.labels[index]}: ${formatCurrency(value)}`;

    const label = document.createElement('span');
    label.className = 'bar-label';
    label.textContent = revenueData.labels[index];
    bar.appendChild(label);

    chartContainer.appendChild(bar);
  });
}

// Update movies chart
function updateMoviesChart() {
  const chartContainer = document.getElementById('moviesChart');
  const movieStats = getMovieStats();

  chartContainer.innerHTML = '';

  if (movieStats.length === 0) {
    chartContainer.innerHTML =
      '<div class="loading-chart">Không có dữ liệu phim</div>';
    return;
  }

  movieStats.forEach(movie => {
    const item = document.createElement('div');
    item.className = 'movie-item';
    item.innerHTML = `
      <div class="movie-info">
        <h4>${movie.name}</h4>
        <p>Thể loại: ${movie.genre}</p>
      </div>
      <div class="movie-count">${movie.count} vé</div>
    `;
    chartContainer.appendChild(item);
  });
}

// Update tables
function updateTables() {
  console.log('📋 Updating tables...');
  updateTopMoviesTable();
  updateCinemaStatsTable();
}

// Update top movies table
function updateTopMoviesTable() {
  const movieStats = getDetailedMovieStats();
  const tbody = document.querySelector('#topMoviesTable tbody');

  tbody.innerHTML = '';

  if (movieStats.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
          Không có dữ liệu phim
        </td>
      </tr>
    `;
    return;
  }

  movieStats.forEach((movie, index) => {
    const row = document.createElement('tr');
    const rankClass =
      index === 0
        ? 'gold'
        : index === 1
        ? 'silver'
        : index === 2
        ? 'bronze'
        : 'other';

    row.innerHTML = `
      <td><div class="rank ${rankClass}">${index + 1}</div></td>
      <td><strong>${movie.name}</strong></td>
      <td><span class="genre-tag">${movie.genre}</span></td>
      <td><strong>${movie.tickets}</strong></td>
      <td><strong class="revenue-text">${formatCurrency(
        movie.revenue,
      )}</strong></td>
    `;

    tbody.appendChild(row);
  });
}

// Update cinema stats table
function updateCinemaStatsTable() {
  const cinemaStats = getCinemaStats();
  const tbody = document.querySelector('#cinemaStatsTable tbody');

  tbody.innerHTML = '';

  if (cinemaStats.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
          Không có dữ liệu rạp chiếu
        </td>
      </tr>
    `;
    return;
  }

  cinemaStats.forEach(cinema => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${cinema.name}</strong></td>
      <td>${cinema.address}</td>
      <td><strong>${cinema.tickets}</strong></td>
      <td><strong class="revenue-text">${formatCurrency(
        cinema.revenue,
      )}</strong></td>
    `;
    tbody.appendChild(row);
  });
}

// Update recent transactions
function updateRecentTransactions() {
  const recentTransactions = getRecentTransactions();
  const container = document.getElementById('recentTransactions');

  container.innerHTML = '';

  if (recentTransactions.length === 0) {
    container.innerHTML =
      '<div style="text-align: center; color: #666; padding: 20px;">Không có giao dịch nào</div>';
    return;
  }

  recentTransactions.forEach(transaction => {
    const item = document.createElement('div');
    item.className = 'transaction-item';

    item.innerHTML = `
      <div class="transaction-info">
        <div class="transaction-avatar">
          ${transaction.customerName.charAt(0).toUpperCase()}
        </div>
        <div class="transaction-details">
          <h4>${transaction.movieName}</h4>
          <p>${transaction.customerName} • ${transaction.date} • ${
      transaction.cinema
    }</p>
        </div>
      </div>
      <div class="transaction-amount">
        ${formatCurrency(transaction.amount)}
      </div>
    `;

    container.appendChild(item);
  });
}

// Get movie statistics
function getMovieStats() {
  const {tickets, movies} = dashboardData;

  if (!tickets || tickets.length === 0) {
    return [];
  }

  const movieCounts = {};
  tickets.forEach(ticket => {
    const movieName = ticket.ten_phim || 'Unknown';
    const movie = movies.find(m => m.ten_phim === movieName);
    if (movie && movie.the_loai && movie.the_loai !== 'Chưa xác định') {
      movieCounts[movieName] = (movieCounts[movieName] || 0) + 1;
    }
  });

  const movieStats = Object.entries(movieCounts).map(([name, count]) => {
    const movie = movies.find(m => m.ten_phim === name);
    return {
      name,
      count,
      genre: movie.the_loai,
    };
  });

  return movieStats.sort((a, b) => b.count - a.count).slice(0, 6);
}

// Get detailed movie statistics
function getDetailedMovieStats() {
  const {tickets, payments, movies} = dashboardData;

  if (!tickets || tickets.length === 0) {
    return [];
  }

  const movieStats = {};

  tickets.forEach(ticket => {
    const movieName = ticket.ten_phim || 'Unknown';
    const movie = movies.find(m => m.ten_phim === movieName);
    if (movie && movie.the_loai && movie.the_loai !== 'Chưa xác định') {
      if (!movieStats[movieName]) {
        movieStats[movieName] = {
          name: movieName,
          tickets: 0,
          revenue: 0,
          genre: movie.the_loai,
        };
      }
      movieStats[movieName].tickets++;

      const payment = payments.find(p => p.ve_id === ticket.ve_id);
      if (payment) {
        movieStats[movieName].revenue +=
          Number.parseFloat(payment.so_tien) || 0;
      }
    }
  });

  return Object.values(movieStats)
    .filter(movie => movie.name && movie.name !== 'Unknown')
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 10);
}

// Get cinema statistics
function getCinemaStats() {
  const {tickets, payments, cinemas} = dashboardData;

  if (!cinemas || cinemas.length === 0) {
    return [];
  }

  const cinemaStats = {};

  cinemas.forEach(cinema => {
    const key = cinema.dia_chi || cinema.ten_rap;
    cinemaStats[key] = {
      name: cinema.ten_rap,
      address: cinema.dia_chi,
      tickets: 0,
      revenue: 0,
    };
  });

  tickets.forEach(ticket => {
    const address = ticket.dia_chi_rap;
    if (cinemaStats[address]) {
      cinemaStats[address].tickets++;

      const payment = payments.find(p => p.ve_id === ticket.ve_id);
      if (payment) {
        cinemaStats[address].revenue += Number.parseFloat(payment.so_tien) || 0;
      }
    }
  });

  return Object.values(cinemaStats).sort((a, b) => b.revenue - a.revenue);
}

// Get recent transactions
function getRecentTransactions() {
  const {payments, tickets, customers} = dashboardData;

  if (!payments || payments.length === 0) {
    return [];
  }

  const transactions = payments.map(payment => {
    const ticket = tickets.find(t => t.ve_id === payment.ve_id);
    const customer = customers.find(
      c => c.khach_hang_id === payment.khach_hang_id,
    );

    return {
      customerName: customer ? customer.ho_ten : 'Khách hàng',
      movieName: ticket ? ticket.ten_phim : 'Phim',
      cinema: ticket ? ticket.dia_chi_rap : 'Rạp chiếu',
      date: payment.ngay_mua || 'Ngày không xác định',
      amount: Number.parseFloat(payment.so_tien) || 0,
      rawDate: payment.ngay_mua,
    };
  });

  transactions.sort((a, b) => {
    if (!a.rawDate || !b.rawDate) return 0;

    const [dayA, monthA, yearA] = a.rawDate.split('/').map(Number);
    const [dayB, monthB, yearB] = b.rawDate.split('/').map(Number);

    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);

    return dateB - dateA;
  });

  return transactions.slice(0, 10);
}

// Generate revenue by date using real payment data
function generateRevenueByDate() {
  const {payments} = dashboardData;

  if (!payments || payments.length === 0) {
    return {
      labels: ['Không có dữ liệu'],
      data: [0],
    };
  }

  const revenueByDate = {};

  payments.forEach(payment => {
    const dateStr = payment.ngay_mua || '';
    if (dateStr) {
      const [day, month, year] = dateStr.split('/');
      const displayDate = `${day}/${month}`;

      if (!revenueByDate[displayDate]) {
        revenueByDate[displayDate] = 0;
      }
      revenueByDate[displayDate] += Number.parseFloat(payment.so_tien) || 0;
    }
  });

  const sortedDates = Object.keys(revenueByDate).sort((a, b) => {
    const [dayA, monthA] = a.split('/').map(Number);
    const [dayB, monthB] = b.split('/').map(Number);

    if (monthA !== monthB) return monthA - monthB;
    return dayA - dayB;
  });

  const recentDates = sortedDates.slice(-7);

  return {
    labels: recentDates,
    data: recentDates.map(date => revenueByDate[date] || 0),
  };
}

// Filter data by date range
function filterDataByDateRange(range) {
  const {payments} = dashboardData;

  if (!payments || payments.length === 0) return;

  let filteredPayments = [...payments];
  const today = new Date();

  if (range !== 'all') {
    filteredPayments = payments.filter(payment => {
      if (!payment.ngay_mua) return false;

      const [day, month, year] = payment.ngay_mua.split('/').map(Number);
      const paymentDate = new Date(year, month - 1, day);

      switch (range) {
        case 'today':
          return (
            paymentDate.getDate() === today.getDate() &&
            paymentDate.getMonth() === today.getMonth() &&
            paymentDate.getFullYear() === today.getFullYear()
          );
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          return paymentDate >= weekAgo;
        case 'month':
          return (
            paymentDate.getMonth() === today.getMonth() &&
            paymentDate.getFullYear() === today.getFullYear()
          );
        default:
          return true;
      }
    });
  }

  const originalPayments = dashboardData.payments;
  dashboardData.payments = filteredPayments;

  updateStatsCards();
  updateRevenueChart();
  updateRecentTransactions();

  dashboardData.payments = originalPayments;
}

// Show error message
function showError(message) {
  const statsCards = document.querySelectorAll('.stat-value');
  statsCards.forEach(card => {
    card.textContent = 'Lỗi';
  });

  const charts = document.querySelectorAll('.simple-chart, .movie-stats');
  charts.forEach(chart => {
    chart.innerHTML = `<div class="loading-chart" style="color: #f44336;">${message}</div>`;
  });

  console.error('Dashboard Error:', message);
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0);
}

// Thống kê phương thức thanh toán
function updatePaymentMethodStats() {
  const paymentMethodsStats = document.getElementById('paymentMethodsStats');
  if (paymentMethodsStats && dashboardData.payments) {
    const methodCounts = {};
    dashboardData.payments.forEach(p => {
      const method = p.phuong_thuc || 'Khác';
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });
    const sorted = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]);
    paymentMethodsStats.innerHTML = sorted
      .map(
        ([method, count]) =>
          `<span style="display:inline-block;margin-right:12px;"><b>${method}:</b> ${count}</span>`,
      )
      .join('');
  }
}

// ===================== THỐNG KÊ THEO PHIM CHI TIẾT =====================

// Lấy thống kê chi tiết theo phim với tính toán cải tiến
function getMovieRevenueStats() {
  const {movies, tickets, payments, cinemas} = dashboardData;
  if (!movies || movies.length === 0) return [];

  let totalRevenue = 0;

  const stats = movies.map(movie => {
    // Lọc vé khớp với phim
    const movieTickets = tickets.filter(
      t =>
        t.ten_phim?.trim().toLowerCase() ===
        movie.ten_phim?.trim().toLowerCase(),
    );

    // Lọc thanh toán khớp với vé (chỉ thanh toán thành công)
    const moviePayments = payments.filter(
      p =>
        movieTickets.some(t => t.ve_id === p.ve_id) &&
        (p.trang_thai === 'Đã thanh toán' || !p.trang_thai),
    );

    // Tính số suất chiếu duy nhất
    const uniqueShowtimes = new Set(movieTickets.map(t => t.suat_chieu_id));
    const shows = uniqueShowtimes.size;

    const ticketsCount = movieTickets.length;
    const revenue = moviePayments.reduce(
      (sum, p) => sum + (Number.parseFloat(p.so_tien) || 0),
      0,
    );

    // Tính toán chi tiết hơn về ghế
    let totalCapacity = 0;
    uniqueShowtimes.forEach(showtimeId => {
      // Tìm rạp cho suất chiếu này
      const ticketForShowtime = movieTickets.find(
        t => t.suat_chieu_id === showtimeId,
      );
      if (ticketForShowtime) {
        const cinema = cinemas.find(
          c =>
            c.id === ticketForShowtime.rap_id ||
            c.ten_rap === ticketForShowtime.dia_chi_rap,
        );
        const seatsInCinema = cinema?.so_ghe || 30; // Default 30 nếu không có thông tin
        totalCapacity += seatsInCinema;
      } else {
        totalCapacity += 30; // Default
      }
    });

    // Tính các chỉ số
    const revenuePerShow = shows > 0 ? revenue / shows : 0;
    const avgTicketPrice = ticketsCount > 0 ? revenue / ticketsCount : 0;
    const fillRate =
      totalCapacity > 0
        ? ((ticketsCount / totalCapacity) * 100).toFixed(2) + '%'
        : 'N/A';

    totalRevenue += revenue;

    return {
      name: movie.ten_phim,
      genre: movie.the_loai || 'Chưa xác định',
      shows,
      tickets: ticketsCount,
      revenue,
      revenuePerShow,
      avgTicketPrice,
      fillRate,
      capacity: totalCapacity,
    };
  });

  // Tính tỷ trọng %
  stats.forEach(s => {
    s.share =
      totalRevenue > 0 ? ((s.revenue / totalRevenue) * 100).toFixed(2) : '0.00';
  });

  // Trả về danh sách phim có dữ liệu, sắp xếp theo doanh thu
  return stats
    .filter(m => m.tickets > 0 || m.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
}

// Render bảng chi tiết doanh thu phim với filter
function renderMovieRevenueTable() {
  const tbody = document.querySelector('#movieRevenueTable tbody');
  if (!tbody) return;

  const searchInput =
    document.querySelector('#movieSearch')?.value.trim().toLowerCase() || '';
  const genreFilter = document.querySelector('#genreFilter')?.value || 'all';

  let data = getMovieRevenueStats();

  // Lọc theo từ khóa
  if (searchInput) {
    data = data.filter(m => m.name.toLowerCase().includes(searchInput));
  }

  // Lọc theo thể loại
  if (genreFilter !== 'all') {
    data = data.filter(
      m => m.genre.toLowerCase() === genreFilter.toLowerCase(),
    );
  }

  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="10" style="text-align:center; padding:15px; color:#777;">
        Không có dữ liệu phù hợp
      </td></tr>`;
    return;
  }

  // Render dữ liệu từng phim
  data.forEach((m, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${m.name}</strong></td>
      <td><span class="genre-tag">${m.genre}</span></td>
      <td>${m.shows}</td>
      <td>${m.tickets}</td>
      <td><strong class="revenue-text">${formatCurrency(
        m.revenue,
      )}</strong></td>
      <td>${m.share}%</td>
      <td>${formatCurrency(m.revenuePerShow)}</td>
      <td>${formatCurrency(m.avgTicketPrice)}</td>
      <td>${m.fillRate}</td>
    `;
    tbody.appendChild(row);
  });

  // Tính tổng cộng
  const totalShows = data.reduce((sum, m) => sum + m.shows, 0);
  const totalTickets = data.reduce((sum, m) => sum + m.tickets, 0);
  const totalRevenue = data.reduce((sum, m) => sum + m.revenue, 0);
  const totalCapacity = data.reduce((sum, m) => sum + m.capacity, 0);
  const avgRevenuePerShow = totalShows > 0 ? totalRevenue / totalShows : 0;
  const avgTicketPrice = totalTickets > 0 ? totalRevenue / totalTickets : 0;
  const fillRate =
    totalCapacity > 0
      ? ((totalTickets / totalCapacity) * 100).toFixed(2) + '%'
      : 'N/A';

  // Render dòng tổng cộng
  const totalRow = document.createElement('tr');
  totalRow.style.fontWeight = 'bold';
  totalRow.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  totalRow.innerHTML = `
    <td colspan="3" style="text-align:center;">📊 TỔNG CỘNG</td>
    <td>${totalShows}</td>
    <td>${totalTickets}</td>
    <td><strong class="revenue-text">${formatCurrency(
      totalRevenue,
    )}</strong></td>
    <td>100%</td>
    <td>${formatCurrency(avgRevenuePerShow)}</td>
    <td>${formatCurrency(avgTicketPrice)}</td>
    <td>${fillRate}</td>
  `;
  tbody.appendChild(totalRow);
}

// Hàm chính cập nhật section doanh thu phim
function updateMovieRevenueSection() {
  renderMovieRevenueTable();
}

// ===================== THỐNG KÊ THEO SUẤT CHIẾU CHI TIẾT =====================

// Lấy thống kê chi tiết theo suất chiếu
function getShowtimeRevenueStats() {
  const {tickets, payments, cinemas, movies} = dashboardData;
  const showtimeStats = {};

  tickets.forEach(ticket => {
    const payment = payments.find(p => p.ve_id === ticket.ve_id);
    if (
      !payment ||
      (payment.trang_thai && payment.trang_thai !== 'Đã thanh toán')
    )
      return;

    const showtimeId = ticket.suat_chieu_id;
    const cinema = cinemas.find(
      c =>
        c.id === ticket.rap_id ||
        c.ten_rap === ticket.dia_chi_rap ||
        c.dia_chi === ticket.dia_chi_rap,
    );
    const movie = movies.find(
      m => m.id === ticket.phim_id || m.ten_phim === ticket.ten_phim,
    );

    const totalSeats = cinema?.so_ghe || 30;

    if (!showtimeStats[showtimeId]) {
      showtimeStats[showtimeId] = {
        suat_chieu_id: showtimeId,
        phim_id: ticket.phim_id,
        ten_phim: movie?.ten_phim || ticket.ten_phim || 'Không rõ',
        the_loai: movie?.the_loai || 'Khác',
        ngay_chieu: ticket.ngay_chieu,
        gio_chieu: ticket.gio_chieu,
        rap_id: ticket.rap_id,
        rap_ten: cinema?.ten_rap || 'Không rõ',
        dia_chi_rap: cinema?.dia_chi || ticket.dia_chi_rap || 'Không rõ',
        so_ve: 0,
        doanh_thu: 0,
        tong_ghe: totalSeats,
      };
    }

    showtimeStats[showtimeId].so_ve++;
    showtimeStats[showtimeId].doanh_thu +=
      Number.parseFloat(payment.so_tien) || 0;
  });

  // Tính các chỉ số bổ sung
  Object.values(showtimeStats).forEach(st => {
    st.gia_ve_tb = st.so_ve > 0 ? st.doanh_thu / st.so_ve : 0;
    st.ti_le_lap_day =
      st.tong_ghe > 0
        ? ((st.so_ve / st.tong_ghe) * 100).toFixed(1) + '%'
        : '0%';
    st.hieu_suat =
      st.tong_ghe > 0
        ? ((st.doanh_thu / (st.tong_ghe * st.gia_ve_tb || 1)) * 100).toFixed(
            1,
          ) + '%'
        : '0%';
  });

  return Object.values(showtimeStats).sort((a, b) => b.doanh_thu - a.doanh_thu);
}

// Render bảng chi tiết doanh thu suất chiếu
function renderShowtimeRevenueTable() {
  const tbody = document.querySelector('#showtimeRevenueTable tbody');
  if (!tbody) return;

  const searchInput =
    document.querySelector('#showtimeSearch')?.value.trim().toLowerCase() || '';
  const genreFilter =
    document.querySelector('#showtimeGenreFilter')?.value || 'all';
  const dateFilter =
    document.querySelector('#showtimeDateFilter')?.value || 'all';

  let data = getShowtimeRevenueStats();

  // Lọc theo từ khóa
  if (searchInput) {
    data = data.filter(
      s =>
        s.ten_phim.toLowerCase().includes(searchInput) ||
        s.rap_ten.toLowerCase().includes(searchInput),
    );
  }

  // Lọc theo thể loại
  if (genreFilter !== 'all') {
    data = data.filter(
      s => s.the_loai.toLowerCase() === genreFilter.toLowerCase(),
    );
  }

  // Lọc theo ngày
  if (dateFilter !== 'all') {
    data = data.filter(s => s.ngay_chieu === dateFilter);
  }

  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="12" style="text-align:center; padding:15px; color:#777;">
        Không có dữ liệu phù hợp
      </td></tr>`;
    return;
  }

  // Render dữ liệu từng suất chiếu
  data.forEach((s, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${s.ten_phim}</strong></td>
      <td><span class="genre-tag">${s.the_loai}</span></td>
      <td>${s.ngay_chieu}</td>
      <td><strong>${s.gio_chieu}</strong></td>
      <td>${s.rap_ten}</td>
      <td style="font-size: 0.85em;">${s.dia_chi_rap}</td>
      <td><strong>${s.so_ve}</strong></td>
      <td>${s.tong_ghe}</td>
      <td><strong class="revenue-text">${formatCurrency(
        s.doanh_thu,
      )}</strong></td>
      <td>${formatCurrency(s.gia_ve_tb)}</td>
      <td><span class="fill-rate ${
        s.so_ve / s.tong_ghe > 0.8
          ? 'high'
          : s.so_ve / s.tong_ghe > 0.5
          ? 'medium'
          : 'low'
      }">${s.ti_le_lap_day}</span></td>
    `;
    tbody.appendChild(row);
  });

  // Tính tổng cộng
  const totalShows = data.length;
  const totalTickets = data.reduce((sum, s) => sum + s.so_ve, 0);
  const totalSeats = data.reduce((sum, s) => sum + s.tong_ghe, 0);
  const totalRevenue = data.reduce((sum, s) => sum + s.doanh_thu, 0);
  const avgTicketPrice = totalTickets > 0 ? totalRevenue / totalTickets : 0;
  const overallFillRate =
    totalSeats > 0
      ? ((totalTickets / totalSeats) * 100).toFixed(2) + '%'
      : 'N/A';

  // Render dòng tổng cộng
  const totalRow = document.createElement('tr');
  totalRow.style.fontWeight = 'bold';
  totalRow.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  totalRow.innerHTML = `
    <td colspan="7" style="text-align:center; color:#ffffff">📊 TỔNG CỘNG (${totalShows} suất chiếu)</td>
    <td style="color:#ffffff">${totalTickets}</td>
    <td style="color:#ffffff">${totalSeats}</td>
    <td style="color:#ffffff"><strong class="revenue-text">${formatCurrency(
      totalRevenue,
    )}</strong></td>
    <td style="color:#ffffff">${formatCurrency(avgTicketPrice)}</td>
    <td style="color:#ffffff"><strong>${overallFillRate}</strong></td>
  `;
  tbody.appendChild(totalRow);
}

// Hàm chính cập nhật section doanh thu suất chiếu
function updateShowtimeRevenueSection() {
  renderShowtimeRevenueTable();
  populateDateFilter(); // Populate date filter với dữ liệu thực
}

// Populate date filter với các ngày có suất chiếu
function populateDateFilter() {
  const dateFilter = document.querySelector('#showtimeDateFilter');
  if (!dateFilter) return;

  const {tickets} = dashboardData;
  const uniqueDates = [
    ...new Set(tickets.map(t => t.ngay_chieu).filter(Boolean)),
  ];

  // Sort dates
  uniqueDates.sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/').map(Number);
    const [dayB, monthB, yearB] = b.split('/').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateB - dateA; // Newest first
  });

  // Clear existing options except "all"
  dateFilter.innerHTML = '<option value="all">Tất cả ngày</option>';

  // Add date options
  uniqueDates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = date;
    dateFilter.appendChild(option);
  });
}

// Setup event listeners cho movie revenue filters
function setupMovieRevenueFilters() {
  const movieSearch = document.querySelector('#movieSearch');
  const movieGenre = document.querySelector('#genreFilter');

  if (movieSearch) {
    movieSearch.addEventListener('input', renderMovieRevenueTable);
  }
  if (movieGenre) {
    movieGenre.addEventListener('change', renderMovieRevenueTable);
  }
}

// Setup event listeners cho showtime revenue filters
function setupShowtimeRevenueFilters() {
  const showtimeSearch = document.querySelector('#showtimeSearch');
  const showtimeGenre = document.querySelector('#showtimeGenreFilter');
  const showtimeDate = document.querySelector('#showtimeDateFilter');

  if (showtimeSearch) {
    showtimeSearch.addEventListener('input', renderShowtimeRevenueTable);
  }
  if (showtimeGenre) {
    showtimeGenre.addEventListener('change', renderShowtimeRevenueTable);
  }
  if (showtimeDate) {
    showtimeDate.addEventListener('change', renderShowtimeRevenueTable);
  }
}

console.log('🎬 Enhanced Cinema Dashboard Script Ready!');
