const API_URL = `http://localhost:3000/phim`;

const filmForm = document.getElementById("filmForm");
const filmList = document.getElementById("filmList");

let allFilms = []; // Lưu tất cả phim để tìm kiếm

async function fetchFilms() {
  const res = await fetch(API_URL);
  const data = await res.json();
  allFilms = data;
  renderFilms(allFilms);
}

// Xử lý tìm kiếm
document.getElementById("searchInput").addEventListener("input", function() {
  const keyword = this.value.trim().toLowerCase();
  const filtered = allFilms.filter(film =>
    film.ten_phim.toLowerCase().includes(keyword)
    // Có thể thêm các trường khác nếu muốn tìm theo nhiều tiêu chí
    // || film.dao_dien.toLowerCase().includes(keyword)
    // || film.the_loai.toLowerCase().includes(keyword)
  );
  renderFilms(filtered);
});
// Hiển thị danh sách phim
function renderFilms(films) {
  filmList.innerHTML = "";
  if (films.length === 0) {
    filmList.innerHTML = "<p>Không có phim nào phù hợp.</p>";
    return;
  }
  films.forEach(film => {
    const card = document.createElement("div");
    card.className = "film-card";
    card.innerHTML = `
      <img src="${film.poster_url}" alt="${film.ten_phim}" style="width:190px;height:320px;object-fit:cover;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <h3>${film.ten_phim}</h3>
      <p><b>Thể loại:</b> ${film.the_loai}</p>
      <p><b>Đạo diễn:</b> ${film.dao_dien}</p>
      <p><b>Ngôn ngữ:</b> ${film.ngon_ngu}</p>
      <p><b>Độ tuổi:</b> ${film.do_tuoi}</p>
      <p><b>Thời lượng:</b> ${film.thoi_luong} phút</p>
      <p><b>Mô tả:</b> ${film.mo_ta}</p>
      <div class="table-actions">
        <button class="edit-btn" onclick="editFilm('${film.phim_id}')"><i class="fas fa-edit"></i> Sửa</button>
        <button class="delete-btn" onclick="deleteFilm('${film.phim_id}')"><i class="fas fa-trash"></i> Xóa</button>
        ${film.trailer_url ? `<a href="${film.trailer_url}" target="_blank" class="trailer-btn" style="margin-left:8px;color:#fff;background:#6366f1;padding:6px 14px;border-radius:6px;text-decoration:none;"><i class="fas fa-play"></i> Xem trailer</a>` : ""}
      </div>
    `;
    filmList.appendChild(card);
  });
}

// Thêm mới hoặc cập nhật phim
filmForm.onsubmit = async function (e) {
  e.preventDefault();
  const phim_id = document.getElementById("phim_id").value;
  const filmData = {
    ten_phim: document.getElementById("ten_phim").value,
    dao_dien: document.getElementById("dao_dien").value,
    ngon_ngu: document.getElementById("ngon_ngu").value,
    do_tuoi: Number(document.getElementById("do_tuoi").value),
    mo_ta: document.getElementById("mo_ta").value,
    thoi_luong: Number(document.getElementById("thoi_luong").value),
    poster_url: document.getElementById("poster_url").value,
    trailer_url: document.getElementById("trailer_url").value,
    the_loai: document.getElementById("the_loai").value,
    phim_id: phim_id
  };

  if (phim_id) {
    // Sửa phim
    await fetch(`${API_URL}/${phim_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filmData)
    });
  } else {
    // Thêm phim
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filmData)
    });
  }
  filmForm.reset();
  document.getElementById("phim_id").value = "";
  fetchFilms();
};

// Sửa phim (điền dữ liệu vào form)
window.editFilm = async function (phim_id) {
  const res = await fetch(`${API_URL}/${phim_id}`);
  const film = await res.json();
  document.getElementById("phim_id").value = film.phim_id;
  document.getElementById("ten_phim").value = film.ten_phim || "";
  document.getElementById("dao_dien").value = film.dao_dien || "";
  document.getElementById("ngon_ngu").value = film.ngon_ngu || "";
  document.getElementById("do_tuoi").value = film.do_tuoi || "";
  document.getElementById("mo_ta").value = film.mo_ta || "";
  document.getElementById("thoi_luong").value = film.thoi_luong || "";
  document.getElementById("poster_url").value = film.poster_url || "";
  document.getElementById("trailer_url").value = film.trailer_url || "";
  document.getElementById("the_loai").value = film.the_loai || "";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Xóa phim
window.deleteFilm = async function (phim_id) {
  if (confirm("Bạn có chắc muốn xóa phim này?")) {
    await fetch(`${API_URL}/${phim_id}`, { method: "DELETE" });
    fetchFilms();
  }
};

// Khởi động
fetchFilms();