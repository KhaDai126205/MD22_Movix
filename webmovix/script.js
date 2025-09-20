// ===================== CẤU HÌNH API =====================
const API_URLS = {
  cinemas: `http://localhost:3000/rapchieu`,
  customers: `https://67ac56315853dfff53da3fd1.mockapi.io/Khach_Hang`,
  movies: `http://localhost:3000/phim`,
  tickets: `http://localhost:3000/ve`,
  payments: `http://localhost:3000/thanhtoan`,
  showtimes: `http://localhost:3000/suatchieu`, // ✅ thêm
};

const dashboardData = {
  cinemas: [],
  customers: [],
  movies: [],
  tickets: [],
  payments: [],
  showtimes: [], // ✅ thêm
};

// ===================== HÀM FETCH DATA =====================
async function fetchData(key, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${key} fetch failed`);
    const data = await res.json();
    dashboardData[key] = data;
    console.log(`✅ Loaded ${key}:`, data);
  } catch (err) {
    console.error(`❌ Error loading ${key}:`, err);
    dashboardData[key] = [];
  }
}

async function loadAllData() {
  try {
    const results = await Promise.allSettled([
      fetchData('cinemas', API_URLS.cinemas),
      fetchData('customers', API_URLS.customers),
      fetchData('movies', API_URLS.movies),
      fetchData('tickets', API_URLS.tickets),
      fetchData('payments', API_URLS.payments),
      fetchData('showtimes', API_URLS.showtimes), // ✅ thêm
    ]);

    console.log('📊 Data load results:', results);

    updateDashboard();
  } catch (err) {
    console.error('❌ Error loading data:', err);
  }
}

// ===================== HÀM XỬ LÝ =====================
// Gom dữ liệu theo phim
function getMovieRevenueStats() {
  const {movies, tickets, payments, showtimes} = dashboardData;
  if (!movies || movies.length === 0) return [];

  let totalRevenue = 0;

  const stats = movies.map(movie => {
    // Vé thuộc phim
    const movieTickets = tickets.filter(
      t =>
        t.ten_phim?.trim().toLowerCase() ===
        movie.ten_phim?.trim().toLowerCase(),
    );

    // Thanh toán thuộc vé
    const moviePayments = payments.filter(p =>
      movieTickets.some(t => t.ve_id === p.ve_id),
    );

    // ✅ Suất chiếu chính xác lấy từ API suất chiếu
    const movieShowtimes = showtimes.filter(
      s => s.phim_id === movie.phim_id, // tùy DB có thể là movie.id
    );
    const shows = movieShowtimes.length;

    const ticketsCount = movieTickets.length;
    const revenue = moviePayments.reduce(
      (sum, p) => sum + (Number.parseFloat(p.so_tien) || 0),
      0,
    );

    totalRevenue += revenue;

    return {
      name: movie.ten_phim,
      genre: movie.the_loai || 'Chưa xác định',
      shows,
      tickets: ticketsCount,
      revenue,
    };
  });

  // Tính tỷ trọng %
  stats.forEach(s => {
    s.share =
      totalRevenue > 0 ? ((s.revenue / totalRevenue) * 100).toFixed(2) : '0.00';
  });

  // Trả về danh sách phim có dữ liệu
  return stats
    .filter(m => m.tickets > 0 || m.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
}

// Render bảng chi tiết (có STT, tìm kiếm, lọc)
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
      <tr><td colspan="7" style="text-align:center; padding:15px; color:#777;">
        Không có dữ liệu
      </td></tr>`;
    return;
  }

  // Render dữ liệu
  data.forEach((m, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${m.name}</strong></td>
      <td>${m.genre}</td>
      <td>${m.shows}</td>
      <td>${m.tickets}</td>
      <td>${formatCurrency(m.revenue)}</td>
      <td>${m.share}%</td>
    `;
    tbody.appendChild(row);
  });
}

// ===================== UPDATE DASHBOARD =====================
function updateMovieRevenueSection() {
  renderMovieRevenueTable();
  renderMovieRevenueCharts();
}

function updateDashboard() {
  console.log('🔄 Updating dashboard...');
  updateStatsCards();
  updateCharts();
  updateTables();
  updateRecentTransactions();
  updatePaymentMethodStats();
  updateMovieRevenueSection(); // ✅ Bổ sung gọi bảng doanh thu theo phim
  console.log('✅ Dashboard updated!');
}

// ===================== SỰ KIỆN =====================
document.addEventListener('DOMContentLoaded', () => {
  const search = document.querySelector('#movieSearch');
  const genre = document.querySelector('#genreFilter');

  if (search) {
    search.addEventListener('input', renderMovieRevenueTable);
  }
  if (genre) {
    genre.addEventListener('change', renderMovieRevenueTable);
  }

  // ✅ Load data khi DOM sẵn sàng
  loadAllData();
});

// ===================== HỖ TRỢ =====================
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}
