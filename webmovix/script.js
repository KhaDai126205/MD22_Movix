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
  foods: `https://688253a466a7eb81224e3f86.mockapi.io/doan/food`, // Đồ ăn đã đặt
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
  foods: [], // Đồ ăn
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
      apiCalls.push(fetchData('foods', API_URLS.foods));
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
        'foods',
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

  // Xác định danh sách vé đã thanh toán hoàn tất
  const paidPaymentList = (payments || []).filter(p => isPaymentCompleted(p));
  const paidVeIdSet = new Set(paidPaymentList.map(p => String(p.ve_id)));

  // Chuẩn hóa text chung
  const normalizeStr = (s) => String(s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  // Chuẩn hóa giờ chiếu dạng khoảng thời gian
  const normalizeTimeRange = (s) => {
    const raw = String(s || '').toLowerCase();
    // thay thế mọi loại dash thành '-'
    const dashUnified = raw.replace(/[–—−]/g, '-');
    // bỏ khoảng trắng thừa quanh dấu gạch
    const noSpaces = dashUnified.replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ');
    // chuẩn hóa ký hiệu giờ: 12h15p -> 12h15, 12:00 -> 12h, giữ nguyên nếu đã là 12h-14h
    const norm = noSpaces
      .replace(/\s/g, '')
      .replace(/:/g, 'h')
      .replace(/ph|p$/g, '')
      .replace(/(\d{1,2})$/g, '$1h') // nếu kết thúc bằng số đơn lẻ coi như giờ
      .replace(/h(?=\d{1,2}h)/g, 'h');
    return norm;
  };

  // Tạo hàm sinh khóa suất chiếu ổn định khi thiếu suat_chieu_id
  const buildShowtimeKey = (t) => {
    const id = t?.suat_chieu_id;
    if (id !== undefined && id !== null && String(id).trim() !== '') {
      return `ID:${String(id)}`;
    }
    const day = (t?.ngay_chieu || '').trim();
    const time = normalizeTimeRange(t?.gio_chieu || '');
    const rapKey = (t?.rap_id !== undefined && t?.rap_id !== null && String(t.rap_id).trim() !== '')
      ? `RID:${String(t.rap_id).trim()}`
      : (t?.dia_chi_rap ? `ADR:${normalizeStr(t.dia_chi_rap)}` : (t?.ten_rap ? `TRP:${normalizeStr(t.ten_rap)}` : ''));
    const key = [day, time, rapKey].filter(Boolean).join('|');
    return key || `VE:${String(t?.ve_id ?? '')}`; // fallback cuối cùng theo ve_id để tránh gom sai về 1
  };

  // Chuẩn hóa tên phim để so khớp tin cậy hơn
  const normalizeTitle = (s) => normalizeStr(s);

  let totalRevenue = 0;

  const stats = movies.map(movie => {
    const movieId = movie.id ?? movie.phim_id;
    const movieNameNorm = normalizeTitle(movie.ten_phim);

    // Lọc vé khớp với phim VÀ đã có thanh toán hoàn tất
    const movieTickets = (tickets || []).filter(t => {
      if (!paidVeIdSet.has(String(t.ve_id))) return false;
      const idMatch = (t.phim_id !== undefined && t.phim_id !== null) && String(t.phim_id) === String(movieId);
      const nameMatch = normalizeTitle(t.ten_phim) === movieNameNorm;
      return idMatch || nameMatch;
    });

    // Lọc thanh toán khớp với vé (chỉ thanh toán thành công)
    const moviePayments = paidPaymentList.filter(p =>
      movieTickets.some(t => String(t.ve_id) === String(p.ve_id)),
    );

    // Tính số suất chiếu duy nhất từ các vé đã thanh toán (dựa vào suat_chieu_id hoặc composite key)
    const uniqueShowtimeKeys = new Set(movieTickets.map(buildShowtimeKey));
    const shows = uniqueShowtimeKeys.size;

    const ticketsCount = movieTickets.length;
    const revenue = moviePayments.reduce(
      (sum, p) => sum + (Number.parseFloat(p.so_tien) || 0),
      0,
    );

    // Tính toán chi tiết hơn về ghế dựa trên vé đã thanh toán
    let totalCapacity = 0;
    uniqueShowtimeKeys.forEach(key => {
      const ticketForShowtime = movieTickets.find(t => buildShowtimeKey(t) === key);
      if (ticketForShowtime) {
        const cinema = cinemas?.find(
          c => String(c.id) === String(ticketForShowtime.rap_id) ||
               normalizeStr(c.ten_rap) === normalizeStr(ticketForShowtime.ten_rap) ||
               normalizeStr(c.dia_chi) === normalizeStr(ticketForShowtime.dia_chi_rap),
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
    s.share = totalRevenue > 0 ? ((s.revenue / totalRevenue) * 100).toFixed(2) : '0.00';
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

function isPaymentCompleted(payment) {
  if (!payment) return false;
  const raw = String(payment.trang_thai || '').toLowerCase();
  if (!raw) return true; // không có trạng thái => coi như hợp lệ (đồng bộ với logic các bảng khác)
  // chấp nhận các biến thể phổ biến
  return (
    raw.includes('đã thanh toán') ||
    raw.includes('da thanh toan') ||
    raw.includes('thanh toán thành công') ||
    raw.includes('thanh toan thanh cong') ||
    raw.includes('completed') ||
    raw.includes('hoàn thành') ||
    raw.includes('hoan thanh') ||
    raw === 'paid' ||
    raw === 'success'
  );
}

// Lấy thống kê chi tiết theo suất chiếu
function getShowtimeRevenueStats() {
  const {tickets, payments, cinemas, movies} = dashboardData;
  const showtimeStats = {};

  // Hàm sinh khóa suất chiếu ổn định để nhóm đúng từng suất
  const normalizeStr = (s) => String(s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const normalizeTimeRange = (s) => {
    const raw = String(s || '').toLowerCase();
    const dashUnified = raw.replace(/[–—−]/g, '-');
    const noSpaces = dashUnified.replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ');
    const norm = noSpaces
      .replace(/\s/g, '')
      .replace(/:/g, 'h')
      .replace(/ph|p$/g, '')
      .replace(/(\d{1,2})$/g, '$1h');
    return norm;
  };

  const buildShowtimeKey = (t) => {
    const id = t?.suat_chieu_id;
    if (id !== undefined && id !== null && String(id).trim() !== '') {
      return `ID:${String(id)}`;
    }
    const day = (t?.ngay_chieu || '').trim();
    const time = normalizeTimeRange(t?.gio_chieu || '');
    const rapKey = (t?.rap_id !== undefined && t?.rap_id !== null && String(t.rap_id).trim() !== '')
      ? `RID:${String(t.rap_id).trim()}`
      : (t?.dia_chi_rap ? `ADR:${normalizeStr(t.dia_chi_rap)}` : (t?.ten_rap ? `TRP:${normalizeStr(t.ten_rap)}` : ''));
    const key = [day, time, rapKey].filter(Boolean).join('|');
    return key || `VE:${String(t?.ve_id ?? '')}`;
  };

  // Duyệt theo payment đã hoàn tất để chắc chắn chỉ lấy suất có thanh toán
  payments.forEach(p => {
    if (!isPaymentCompleted(p)) return;
    const ticket = tickets.find(t => String(t.ve_id) === String(p.ve_id));
    if (!ticket) return; // không có vé tương ứng thì bỏ qua

    const key = buildShowtimeKey(ticket);
    const cinema = cinemas.find(
      c => String(c.id) === String(ticket.rap_id) ||
           normalizeStr(c.ten_rap) === normalizeStr(ticket.ten_rap) ||
           normalizeStr(c.dia_chi) === normalizeStr(ticket.dia_chi_rap),
    );
    const movie = movies.find(m => m.id === ticket.phim_id || m.ten_phim === ticket.ten_phim);

    const totalSeats = cinema?.so_ghe || 30;

    if (!showtimeStats[key]) {
      showtimeStats[key] = {
        suat_chieu_id: ticket.suat_chieu_id,
        phim_id: ticket.phim_id,
        ten_phim: movie?.ten_phim || ticket.ten_phim || 'Không rõ',
        the_loai: movie?.the_loai || 'Khác',
        ngay_chieu: ticket.ngay_chieu,
        gio_chieu: ticket.gio_chieu,
        rap_id: ticket.rap_id,
        rap_ten: cinema?.ten_rap || ticket.ten_rap || 'Không rõ',
        dia_chi_rap: cinema?.dia_chi || ticket.dia_chi_rap || 'Không rõ',
        so_ve: 0,
        doanh_thu: 0,
        tong_ghe: totalSeats,
      };
    }

    showtimeStats[key].so_ve += 1;
    showtimeStats[key].doanh_thu += Number.parseFloat(p.so_tien) || 0;
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

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(data.length / showtimePerPage));
  if (showtimePage > totalPages) showtimePage = totalPages;
  const start = (showtimePage - 1) * showtimePerPage;
  const pageItems = data.slice(start, start + showtimePerPage);

  tbody.innerHTML = '';

  if (pageItems.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="12" style="text-align:center; padding:15px; color:#777;">
        Không có dữ liệu phù hợp
      </td></tr>`;
    return;
  }

  // Render dữ liệu từng suất chiếu
  pageItems.forEach((s, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${start + index + 1}</td>
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

  // Render phân trang
  let html = `
    <button ${showtimePage === 1 ? 'disabled' : ''} onclick="changeShowtimePage(${showtimePage - 1})"><i class="fas fa-chevron-left"></i></button>
  `;
  const startPage = Math.max(1, showtimePage - 2);
  const endPage = Math.min(totalPages, showtimePage + 2);
  if (startPage > 1) {
    html += `<button onclick="changeShowtimePage(1)">1</button>`;
    if (startPage > 2) html += `<span class="page-info">...</span>`;
  }
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="${i === showtimePage ? 'active' : ''}" onclick="changeShowtimePage(${i})">${i}</button>`;
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="page-info">...</span>`;
    html += `<button onclick="changeShowtimePage(${totalPages})">${totalPages}</button>`;
  }
  html += `
    <button ${showtimePage === totalPages ? 'disabled' : ''} onclick="changeShowtimePage(${showtimePage + 1})"><i class="fas fa-chevron-right"></i></button>
    <div class="page-info">Hiển thị ${data.length === 0 ? 0 : (start + 1)}-${Math.min(start + showtimePerPage, data.length)} của ${data.length} suất chiếu</div>
  `;
  const paginationContainer = document.getElementById('showtimePagination');
  if (paginationContainer) {
    paginationContainer.innerHTML = html;
  }
}

// Hàm chính cập nhật section doanh thu suất chiếu
function updateShowtimeRevenueSection() {
  renderShowtimeRevenueTable();
  populateDateFilter(); // Populate date filter với dữ liệu thực
}

// Phân trang suất chiếu
let showtimePage = 1;
const showtimePerPage = 10;

function changeShowtimePage(p) {
  showtimePage = p;
  renderShowtimeRevenueTable();
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
    showtimeSearch.addEventListener('input', () => { showtimePage = 1; renderShowtimeRevenueTable(); });
  }
  if (showtimeGenre) {
    showtimeGenre.addEventListener('change', () => { showtimePage = 1; renderShowtimeRevenueTable(); });
  }
  if (showtimeDate) {
    showtimeDate.addEventListener('change', () => { showtimePage = 1; renderShowtimeRevenueTable(); });
  }
}

console.log('🎬 Enhanced Cinema Dashboard Script Ready!');
// ===================== LỊCH SỬ THANH TOÁN (GIAO DỊCH) =====================

// State phân trang giao dịch
let giaoDichPage = 1;
const giaoDichPerPage = 10;
let giaoDichCache = []; // dữ liệu sau khi join từ payments + tickets + customers

// Chuẩn hóa về "giao dịch" từ payments + tickets + customers
function buildTransactionsFromExistingData() {
  const { payments, tickets, customers } = dashboardData;
  if (!payments || payments.length === 0) return [];

  // Gom vé theo thanh toán (1 payment ↔ 1 vé trong cấu trúc hiện tại)
  // Nếu sau này bạn có bảng giao dịch riêng, chỉ cần thay nguồn dữ liệu ở đây.
  const byCode = new Map(); // key: ma_giao_dich (sinh tạm), value: tx

  payments.forEach((p, idx) => {
    const ticket = tickets.find(t => t.ve_id === p.ve_id);
    const customer = customers.find(
      c => String(c.khach_hang_id) === String(p.khach_hang_id)
    );

    const maGD = p.ma_giao_dich || `GD${(p.thanh_toan_id || idx + 1).toString().padStart(6, '0')}`;
    if (!byCode.has(maGD)) {
      byCode.set(maGD, {
        ma_giao_dich: maGD,
        khach_hang: customer ? customer.ho_ten : 'Khách vãng lai',
        khach_hang_id: p.khach_hang_id,
        phim: ticket?.ten_phim || 'Không rõ',
        rap: ticket?.dia_chi_rap || 'Không rõ',
        so_ve: 0,
        thanh_tien: 0,
        phuong_thuc: p.phuong_thuc || 'cash',
        trang_thai: (p.trang_thai && p.trang_thai.toLowerCase().includes('thanh')) ? 'completed' : 'completed',
        ngay_thanh_toan: p.ngay_mua || '',
        items: [],
        foods: [],
        food_total: 0,
        _foodsAdded: false,
      });
    }

    const tx = byCode.get(maGD);
    tx.so_ve += 1;
    tx.thanh_tien += Number.parseFloat(p.so_tien) || 0;
    tx.items.push({
      ten_phim: ticket?.ten_phim || 'Không rõ',
      rap: ticket?.dia_chi_rap || 'Không rõ',
      ngay_chieu: ticket?.ngay_chieu || '',
      gio_chieu: ticket?.gio_chieu || '',
      ghe: ticket?.vi_tri_ghe || '',
      gia_ve: Number.parseFloat(p.so_tien) || 0
    });

    // Bổ sung đồ ăn đã đặt của khách hàng (theo khach_hang_id)
    if (!tx._foodsAdded) {
      const customerId = p.khach_hang_id;
      const paidDate = p.ngay_mua || tx.ngay_thanh_toan || '';
      const foodsOrdered = (dashboardData.foods || []).flatMap(f => {
        const orders = Array.isArray(f.khach_hang_id) ? f.khach_hang_id : [];
        return orders
          .filter(o => String(o.id) === String(customerId) && (!paidDate || String(o.ngay_dat) === String(paidDate)))
          .map(o => {
            const unitPrice = Number.parseFloat(f.price) || 0;
            const qty = Number(o.so_luong || o.quantity || o.qty || 1);
            return {
              ten_mon: f.name || f.ten_mon || f.ten || 'Món',
              gia: unitPrice,
              so_luong: qty,
              thanh_tien: unitPrice * qty,
              anh: f.image || '',
              ngay_dat: o.ngay_dat || '',
              gio_chieu: o.gio_chieu || '',
            };
          });
      });
      if (foodsOrdered.length > 0) {
        tx.foods = foodsOrdered;
        tx.food_total = foodsOrdered.reduce((s, it) => s + (it.thanh_tien || (it.gia || 0)), 0);
        tx.food_count = foodsOrdered.reduce((s, it) => s + (it.so_luong || 1), 0);
      }
      tx._foodsAdded = true;
    }
  });

  // Sắp xếp mới nhất trước theo ngày thanh toán
  const arr = Array.from(byCode.values());
  arr.sort((a, b) => {
    const pa = a.ngay_thanh_toan?.split('/') || [];
    const pb = b.ngay_thanh_toan?.split('/') || [];
    if (pa.length === 3 && pb.length === 3) {
      const da = new Date(+pa[2], +pa[1] - 1, +pa[0]);
      const db = new Date(+pb[2], +pb[1] - 1, +pb[0]);
      return db - da;
    }
    return 0;
  });

  return arr;
}

function renderGiaoDichTable() {
  const tbody = document.querySelector('#giaoDichTable tbody');
  const pagination = document.getElementById('giaoDichPagination');
  if (!tbody || !pagination) return;

  // Lọc theo ô tìm kiếm + filter
  const kw = (document.getElementById('giaoDichSearch')?.value || '').trim().toLowerCase();
  const status = document.getElementById('giaoDichStatusFilter')?.value || 'all';
  const payment = document.getElementById('giaoDichPaymentFilter')?.value || 'all';

  let data = [...giaoDichCache];

  if (kw) {
    data = data.filter(tx =>
      tx.ma_giao_dich.toLowerCase().includes(kw) ||
      tx.khach_hang.toLowerCase().includes(kw) ||
      tx.phim.toLowerCase().includes(kw) ||
      tx.rap.toLowerCase().includes(kw)
    );
  }
  if (status !== 'all') {
    data = data.filter(tx => tx.trang_thai === status);
  }
  if (payment !== 'all') {
    data = data.filter(tx => (tx.phuong_thuc || '').toLowerCase() === payment);
  }

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(data.length / giaoDichPerPage));
  if (giaoDichPage > totalPages) giaoDichPage = totalPages;
  const start = (giaoDichPage - 1) * giaoDichPerPage;
  const pageItems = data.slice(start, start + giaoDichPerPage);

  // Render tbody
  if (pageItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="loading-row" style="text-align:center;color:#999">Không có giao dịch</td>
      </tr>
    `;
  } else {
    tbody.innerHTML = pageItems
      .map((tx, idx) => {
        return `
          <tr>
            <td>${start + idx + 1}</td>
            <td><strong>${tx.ma_giao_dich}</strong></td>
            <td>${tx.khach_hang}</td>
            <td>${tx.phim}</td>
            <td>${tx.rap}</td>
            <td>${tx.so_ve}</td>
            <td><strong class="revenue-text">${formatCurrency(tx.thanh_tien)}</strong></td>
            <td>${getPaymentMethodName(tx.phuong_thuc)}</td>
            <td><span class="status ${tx.trang_thai}">${getStatusText(tx.trang_thai)}</span></td>
            <td>${tx.ngay_thanh_toan || ''}</td>
            <td>
              <button class="table-btn" onclick="openTransactionModal('${tx.ma_giao_dich}')">
                <i class="fas fa-eye"></i> Xem
              </button>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  // Render phân trang
  let html = `
    <button ${giaoDichPage === 1 ? 'disabled' : ''} onclick="changeGiaoDichPage(${giaoDichPage - 1})"><i class="fas fa-chevron-left"></i></button>
  `;
  const startPage = Math.max(1, giaoDichPage - 2);
  const endPage = Math.min(totalPages, giaoDichPage + 2);
  if (startPage > 1) {
    html += `<button onclick="changeGiaoDichPage(1)">1</button>`;
    if (startPage > 2) html += `<span class="page-info">...</span>`;
  }
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="${i === giaoDichPage ? 'active' : ''}" onclick="changeGiaoDichPage(${i})">${i}</button>`;
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="page-info">...</span>`;
    html += `<button onclick="changeGiaoDichPage(${totalPages})">${totalPages}</button>`;
  }
  html += `
    <button ${giaoDichPage === totalPages ? 'disabled' : ''} onclick="changeGiaoDichPage(${giaoDichPage + 1})"><i class="fas fa-chevron-right"></i></button>
    <div class="page-info">Hiển thị ${data.length === 0 ? 0 : (start + 1)}-${Math.min(start + giaoDichPerPage, data.length)} của ${data.length} giao dịch</div>
  `;
  pagination.innerHTML = html;
}

function changeGiaoDichPage(p) {
  giaoDichPage = p;
  renderGiaoDichTable();
}

function getPaymentMethodName(method) {
  const names = {
    cash: 'Tiền mặt',
    card: 'Thẻ tín dụng',
    momo: 'MoMo',
    zalopay: 'ZaloPay',
    banking: 'Chuyển khoản'
  };
  return names[(method || '').toLowerCase()] || method || 'Khác';
}

function getStatusText(status) {
  const map = {
    completed: 'Hoàn thành',
    pending: 'Chờ thanh toán',
    cancelled: 'Đã hủy',
    refunded: 'Đã hoàn tiền'
  };
  return map[(status || '').toLowerCase()] || 'Hoàn thành';
}

function openTransactionModal(maGD) {
  const tx = giaoDichCache.find(t => t.ma_giao_dich === maGD);
  if (!tx) return;

  document.getElementById('gdModalTitle').textContent = `Chi tiết giao dịch: ${tx.ma_giao_dich}`;
  const body = document.getElementById('gdModalBody');
  body.innerHTML = `
    <div class="giao-dich-info" style="margin-bottom:16px">
      <div class="info-row"><label>Mã GD:</label><span>${tx.ma_giao_dich}</span></div>
      <div class="info-row"><label>Khách hàng:</label><span>${tx.khach_hang}</span></div>
      <div class="info-row"><label>Phương thức:</label><span>${getPaymentMethodName(tx.phuong_thuc)}</span></div>
      <div class="info-row"><label>Trạng thái:</label><span class="status ${tx.trang_thai}">${getStatusText(tx.trang_thai)}</span></div>
      <div class="info-row"><label>Ngày thanh toán:</label><span>${tx.ngay_thanh_toan || ''}</span></div>
      <div class="info-row"><label>Thành tiền:</label><span class="total-amount">${formatCurrency(tx.thanh_tien)}</span></div>
    </div>
    <div class="ve-details">
      <h4>Chi tiết vé (${tx.items.length} vé):</h4>
      <div class="ve-list">
        ${tx.items
          .map(
            v => `
          <div class="ve-item">
            <div>
              <div class="ve-movie">${v.ten_phim}</div>
              <div class="ve-details-text">${v.rap}<br>${v.ngay_chieu} - ${v.gio_chieu}<br>Ghế: ${v.ghe}</div>
            </div>
            <div class="ve-price">${formatCurrency(v.gia_ve)}</div>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
    ${tx.foods && tx.foods.length > 0 ? `
    <div class="ve-details" style="margin-top:16px;">
      <h4>Đồ ăn đã đặt (${tx.food_count || tx.foods.length} món):</h4>
      <div class="ve-list">
        ${tx.foods
          .map(
            f => `
          <div class="ve-item">
            <div>
              <div class="ve-movie">${f.ten_mon} x ${f.so_luong || 1}</div>
              <div class="ve-details-text">${f.ngay_dat || ''} ${f.gio_chieu ? '- ' + f.gio_chieu + 'h' : ''}</div>
            </div>
            <div class="ve-price">${formatCurrency(f.gia)}${(f.so_luong && f.so_luong > 1) ? ` × ${f.so_luong} = <strong>${formatCurrency(f.thanh_tien || (f.gia * f.so_luong))}</strong>` : ''}</div>
          </div>
        `,
          )
          .join('')}
      </div>
      <div style="text-align:right;margin-top:8px;font-weight:700;color:#10b981;">Tổng đồ ăn: ${formatCurrency(tx.food_total || 0)}</div>
    </div>` : ''}
  `;
  document.getElementById('transactionModal').style.display = 'block';
}

function closeTransactionModal() {
  const m = document.getElementById('transactionModal');
  if (m) m.style.display = 'none';
}

function exportGiaoDich() {
  const rows = [['Mã GD', 'Khách hàng', 'Phim', 'Rạp', 'Số vé', 'Thành tiền', 'Phương thức', 'Trạng thái', 'Ngày thanh toán']];
  giaoDichCache.forEach(tx => {
    rows.push([
      tx.ma_giao_dich,
      tx.khach_hang,
      tx.phim,
      tx.rap,
      String(tx.so_ve),
      String(tx.thanh_tien),
      getPaymentMethodName(tx.phuong_thuc),
      getStatusText(tx.trang_thai),
      tx.ngay_thanh_toan || ''
    ]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `giao_dich_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// Gắn vào vòng đời dashboard
const _oldUpdate = updateDashboard;
updateDashboard = function() {
  _oldUpdate();
  // Build once mỗi lần load data
  giaoDichCache = buildTransactionsFromExistingData();
  // Render lần đầu
  renderGiaoDichTable();

  // Gắn filter events 1 lần
  document.getElementById('giaoDichSearch')?.addEventListener('input', () => {
    giaoDichPage = 1;
    renderGiaoDichTable();
  });
  document.getElementById('giaoDichStatusFilter')?.addEventListener('change', () => {
    giaoDichPage = 1;
    renderGiaoDichTable();
  });
  document.getElementById('giaoDichPaymentFilter')?.addEventListener('change', () => {
    giaoDichPage = 1;
    renderGiaoDichTable();
  });
};