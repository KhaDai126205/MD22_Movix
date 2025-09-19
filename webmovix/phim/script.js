const API_URL = `http://localhost:3000/phim`;

const filmForm = document.getElementById('filmForm');
const filmList = document.getElementById('filmList');
const searchInput = document.getElementById('searchInput');
const pagination = document.getElementById('pagination');

// ================== TẠO DROPDOWN LỌC ==================
const filterGenre = document.createElement('select');
filterGenre.id = 'filterGenre';
filterGenre.innerHTML = `
  <option value="">-- Tất cả thể loại --</option>
  <option>Hành động</option>
  <option>Phiêu lưu</option>
  <option>Hài</option>
  <option>Tình cảm / Lãng mạn</option>
  <option>Tâm lý</option>
  <option>Kinh dị</option>
  <option>Giật gân</option>
  <option>Bí ẩn</option>
  <option>Khoa học viễn tưởng</option>
  <option>Viễn tưởng - Giả tưởng</option>
  <option>Hình sự</option>
  <option>Chiến tranh</option>
  <option>Chính kịch</option>
  <option>Tài liệu</option>
  <option>Phim tiểu sử</option>
  <option>Âm nhạc</option>
  <option>Gia đình</option>
  <option>Thể thao</option>
  <option>Phim thiếu nhi</option>
`;
document.querySelector('.film-search-card').appendChild(filterGenre);

const filterAge = document.createElement('select');
filterAge.id = 'filterAge';
filterAge.innerHTML = `
  <option value="">-- Tất cả độ tuổi --</option>
  <option value="13">13+</option>
  <option value="16">16+</option>
  <option value="18">18+</option>
`;
document.querySelector('.film-search-card').appendChild(filterAge);

// ================== BIẾN TOÀN CỤC ==================
let allFilms = [];
let currentPage = 1;
const filmsPerPage = 5;

// ================== FETCH DATA ==================
async function fetchFilms() {
  const res = await fetch(API_URL);
  const data = await res.json();
  allFilms = data;
  applyFilters();
}

// ================== TÌM KIẾM + LỌC ==================
function applyFilters() {
  const keyword = (searchInput.value || '').trim().toLowerCase();
  const genre = filterGenre.value;
  const age = filterAge.value;

  let filtered = allFilms.slice();

  // Tìm kiếm theo tên
  if (keyword) {
    filtered = filtered.filter(
      film => film.ten_phim && film.ten_phim.toLowerCase().includes(keyword),
    );
  }

  // Lọc theo thể loại
  if (genre) {
    filtered = filtered.filter(
      film =>
        film.the_loai && film.the_loai.toLowerCase() === genre.toLowerCase(),
    );
  }

  // Lọc theo độ tuổi (chính xác)
  if (age) {
    const ageNum = Number(age);
    filtered = filtered.filter(film => {
      const filmAge = Number(film.do_tuoi);
      return !Number.isNaN(filmAge) && filmAge === ageNum;
    });
  }

  // Nếu không có phim phù hợp
  if (!filtered.length) {
    filmList.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;padding:18px;color:#ff6d28;font-weight:700;">
          🚫 Không có phim nào phù hợp với điều kiện lọc.
          <div style="margin-top:6px;font-size:13px;color:#ffd93d;">
            Thử thay đổi thể loại, độ tuổi hoặc từ khóa tìm kiếm.
          </div>
        </td>
      </tr>
    `;
    pagination.innerHTML = '';
    return;
  }

  renderFilms(filtered);
}

// ================== HIỂN THỊ DANH SÁCH ==================
function renderFilms(films) {
  filmList.innerHTML = '';

  const start = (currentPage - 1) * filmsPerPage;
  const end = start + filmsPerPage;
  const paginatedFilms = films.slice(start, end);

  paginatedFilms.forEach((film, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td><img src="${film.poster_url}" alt="${
      film.ten_phim
    }" style="width:60px;height:90px;object-fit:cover;border-radius:4px;"></td>
      <td>${film.ten_phim}</td>
      <td>${film.dao_dien}</td>
      <td>${film.ngon_ngu}</td>
      <td>${film.do_tuoi}+</td>
      <td>${film.thoi_luong} phút</td>
      <td>${film.the_loai}</td>
      <td>
        <button class="edit-btn" onclick="editFilm('${
          film.phim_id
        }')"><i class="fas fa-edit"></i></button>
        <button class="delete-btn" onclick="deleteFilm('${
          film.phim_id
        }')"><i class="fas fa-trash"></i></button>
        ${
          film.trailer_url
            ? `<a href="${film.trailer_url}" target="_blank" class="trailer-btn"><i class="fas fa-play"></i></a>`
            : ''
        }
      </td>
    `;
    filmList.appendChild(row);
  });

  renderPagination(films.length);
}

// ================== PHÂN TRANG ==================
function renderPagination(totalFilms) {
  pagination.innerHTML = '';
  const totalPages = Math.ceil(totalFilms / filmsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === currentPage ? 'active' : '';
    btn.addEventListener('click', () => {
      currentPage = i;
      applyFilters();
    });
    pagination.appendChild(btn);
  }
}

// ================== CRUD ==================
filmForm.onsubmit = async function (e) {
  e.preventDefault();
  const phim_id = document.getElementById('phim_id').value;
  const filmData = {
    ten_phim: document.getElementById('ten_phim').value,
    dao_dien: document.getElementById('dao_dien').value,
    ngon_ngu: document.getElementById('ngon_ngu').value,
    do_tuoi: Number(document.getElementById('do_tuoi').value),
    mo_ta: document.getElementById('mo_ta').value,
    thoi_luong: Number(document.getElementById('thoi_luong').value),
    poster_url: document.getElementById('poster_url').value,
    trailer_url: document.getElementById('trailer_url').value,
    the_loai: document.getElementById('the_loai').value,
    phim_id: phim_id,
  };

  if (phim_id) {
    await fetch(`${API_URL}/${phim_id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(filmData),
    });
  } else {
    await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(filmData),
    });
  }

  filmForm.reset();
  document.getElementById('phim_id').value = '';
  fetchFilms();
};

window.editFilm = async function (phim_id) {
  const res = await fetch(`${API_URL}/${phim_id}`);
  const film = await res.json();
  document.getElementById('phim_id').value = film.phim_id;
  document.getElementById('ten_phim').value = film.ten_phim || '';
  document.getElementById('dao_dien').value = film.dao_dien || '';
  document.getElementById('ngon_ngu').value = film.ngon_ngu || '';
  document.getElementById('do_tuoi').value = film.do_tuoi || '';
  document.getElementById('mo_ta').value = film.mo_ta || '';
  document.getElementById('thoi_luong').value = film.thoi_luong || '';
  document.getElementById('poster_url').value = film.poster_url || '';
  document.getElementById('trailer_url').value = film.trailer_url || '';
  document.getElementById('the_loai').value = film.the_loai || '';
  window.scrollTo({top: 0, behavior: 'smooth'});
};

window.deleteFilm = async function (phim_id) {
  if (confirm('Bạn có chắc muốn xóa phim này?')) {
    await fetch(`${API_URL}/${phim_id}`, {method: 'DELETE'});
    fetchFilms();
  }
};

// ================== EVENT LISTENERS ==================
searchInput.addEventListener('input', () => {
  currentPage = 1;
  applyFilters();
});

filterGenre.addEventListener('change', () => {
  currentPage = 1;
  applyFilters();
});

filterAge.addEventListener('change', () => {
  currentPage = 1;
  applyFilters();
});

// ================== INIT ==================
fetchFilms();
