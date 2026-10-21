const STORAGE_KEY = "melody-library-v1";
const SEED_TRACKS = [
  { id: "demo-1", title: "Ánh nắng đầu ngày", artist: "Melody Sessions", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=160&q=80", mood: "Chill", duration: "6:13", favorite: true },
  { id: "demo-2", title: "Thành phố lên đèn", artist: "Neon Notes", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", cover: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=160&q=80", mood: "Năng lượng", duration: "7:04", favorite: false },
  { id: "demo-3", title: "Một ngày dịu êm", artist: "Luna & Co.", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", cover: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=160&q=80", mood: "Đêm", duration: "5:02", favorite: true },
  { id: "demo-4", title: "Khoảng lặng", artist: "Ambient Room", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", cover: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=160&q=80", mood: "Tập trung", duration: "5:31", favorite: false },
  { id: "demo-5", title: "Chạm vào hoàng hôn", artist: "Sunday Sound", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", cover: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=160&q=80", mood: "Chill", duration: "6:18", favorite: false }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const audio = $("#audio-player");
let tracks = loadTracks();
let currentTrackId = null;
let isShuffle = false;
let repeatCurrent = false;
let toastTimeout;

function loadTracks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return SEED_TRACKS.map(track => ({ ...track }));
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(track => track && typeof track.id === "string" && typeof track.title === "string" && typeof track.artist === "string" && typeof track.audio === "string")) {
      throw new Error("Thư viện bài hát không đúng định dạng.");
    }
    return parsed;
  } catch (error) {
    console.error("Không thể tải thư viện nhạc đã lưu:", error);
    return SEED_TRACKS.map(track => ({ ...track }));
  }
}

function saveTracks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
    return true;
  } catch (error) {
    console.error("Không thể lưu thư viện nhạc:", error);
    showToast("Không thể lưu thay đổi. Hãy kiểm tra dung lượng trình duyệt.");
    return false;
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function coverMarkup(track) {
  const palette = ["linear-gradient(145deg,#39485d,#a07787)", "linear-gradient(145deg,#31525a,#8eaa91)", "linear-gradient(145deg,#49405f,#c19481)", "linear-gradient(145deg,#44504d,#9c875b)", "linear-gradient(145deg,#383952,#9e7592)"];
  const color = palette[Math.abs([...track.id].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % palette.length];
  return track.cover ? `<img src="${escapeHTML(track.cover)}" data-fallback-color="${color}" alt="" loading="lazy">` : `<span class="track-cover-fallback" style="background:${color}">♫</span>`;
}

function trackRow(track, index) {
  const favoriteClass = track.favorite ? " is-favorite" : "";
  const duration = track.duration || "--:--";
  return `<article class="track-row${track.id === currentTrackId ? " is-playing" : ""}" data-track-id="${escapeHTML(track.id)}">
    <span class="track-index">${String(index + 1).padStart(2, "0")}</span>
    <button class="row-play" aria-label="${track.id === currentTrackId && !audio.paused ? "Tạm dừng" : "Phát"} ${escapeHTML(track.title)}">${track.id === currentTrackId && !audio.paused ? "Ⅱ" : "▶"}</button>
    <div class="track-cover">${coverMarkup(track)}</div>
    <div class="track-main"><strong>${escapeHTML(track.title)}</strong><span>${escapeHTML(track.artist)}</span></div>
    <span class="track-mood">${escapeHTML(track.mood || "Chill")}</span>
    <span class="track-duration">${escapeHTML(duration)}</span>
    <button class="favorite-button${favoriteClass}" data-action="favorite" aria-label="${track.favorite ? "Bỏ yêu thích" : "Thêm yêu thích"}" title="${track.favorite ? "Bỏ yêu thích" : "Thêm yêu thích"}">${track.favorite ? "♥" : "♡"}</button>
    <div class="row-actions"><button class="row-menu-button" data-action="menu" aria-label="Tùy chọn bài hát">···</button>
      <div class="row-dropdown" hidden><button data-action="edit">Chỉnh sửa</button><button class="delete-track" data-action="delete">Xóa bài hát</button></div>
    </div>
  </article>`;
}

function render() {
  const query = $("#search-input").value.trim().toLocaleLowerCase("vi");
  const matches = track => `${track.title} ${track.artist} ${track.mood || ""}`.toLocaleLowerCase("vi").includes(query);
  const filtered = tracks.filter(matches);
  const favorites = filtered.filter(track => track.favorite);
  $("#recent-track-list").innerHTML = filtered.slice(0, 5).map(trackRow).join("");
  $("#library-track-list").innerHTML = filtered.map(trackRow).join("");
  $("#favorites-track-list").innerHTML = favorites.map(trackRow).join("");
  $$(".track-cover img").forEach(image => image.addEventListener("error", () => {
    const fallback = document.createElement("span");
    fallback.className = "track-cover-fallback";
    fallback.style.background = image.dataset.fallbackColor;
    fallback.textContent = "♫";
    image.replaceWith(fallback);
  }, { once: true }));
  $("#home-empty-state").hidden = tracks.length > 0;
  $("#library-empty-state").hidden = tracks.length > 0;
  $("#favorites-empty-state").hidden = favorites.length > 0;
  $("#library-count").textContent = `${filtered.length} bài hát`;
  $("#sidebar-track-count").textContent = `${tracks.length} bài hát`;
  if (query) {
    $("#home-empty-state").hidden = filtered.length > 0;
    $("#library-empty-state").hidden = filtered.length > 0;
    $("#favorites-empty-state").hidden = favorites.length > 0;
  }
  updatePlayerFavorite();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2800);
}

function updatePlayerFavorite() {
  const button = $("#player-favorite");
  const track = tracks.find(item => item.id === currentTrackId);
  button.disabled = !track;
  button.textContent = track && track.favorite ? "♥" : "♡";
  button.classList.toggle("is-favorite", Boolean(track && track.favorite));
  button.setAttribute("aria-label", track && track.favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích");
}

function updateNowPlaying(track) {
  $("#player-title").textContent = track.title;
  $("#player-artist").textContent = track.artist;
  const cover = $("#player-cover");
  cover.innerHTML = track.cover ? `<img src="${escapeHTML(track.cover)}" alt="">` : "<span>♫</span>";
  const image = $("img", cover);
  if (image) image.addEventListener("error", () => { cover.innerHTML = "<span>♫</span>"; }, { once: true });
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function playTrack(track) {
  if (!track) return;
  const sameTrack = currentTrackId === track.id;
  if (sameTrack && !audio.paused) {
    audio.pause();
    return;
  }
  if (!sameTrack) {
    currentTrackId = track.id;
    audio.src = track.audio;
    updateNowPlaying(track);
  }
  audio.play().then(() => {
    $("#play-button").textContent = "Ⅱ";
    $("#play-button").setAttribute("aria-label", "Tạm dừng");
    render();
  }).catch(error => {
    console.error("Không thể phát bài hát:", error);
    showToast("Không phát được bài hát. Hãy kiểm tra đường dẫn audio.");
  });
  render();
}

function playNext(direction = 1) {
  if (!tracks.length) {
    showToast("Thư viện chưa có bài hát nào.");
    return;
  }
  let index = tracks.findIndex(track => track.id === currentTrackId);
  if (isShuffle && tracks.length > 1) {
    let randomIndex;
    do { randomIndex = Math.floor(Math.random() * tracks.length); } while (randomIndex === index);
    index = randomIndex;
  } else {
    index = (index + direction + tracks.length) % tracks.length;
  }
  playTrack(tracks[index]);
}

function navigate(page) {
  const knownPage = ["home", "library", "favorites", "contact"].includes(page) ? page : "home";
  $$(".page-section").forEach(section => { section.hidden = section.id !== `${knownPage}-page`; });
  $$(".nav-link[data-page]").forEach(link => link.classList.toggle("active", link.dataset.page === knownPage));
  if (location.hash !== `#${knownPage}`) history.pushState({ page: knownPage }, "", `#${knownPage}`);
}

function openSongDialog(track = null) {
  const form = $("#song-form");
  form.reset();
  $("#song-error").textContent = "";
  $("#song-id").value = track ? track.id : "";
  $("#dialog-title").textContent = track ? "Chỉnh sửa bài hát" : "Thêm bài hát";
  $("#save-song-button").textContent = track ? "Lưu thay đổi" : "Thêm vào thư viện";
  if (track) {
    $("#song-title").value = track.title;
    $("#song-artist").value = track.artist;
    $("#song-audio").value = track.audio;
    $("#song-cover").value = track.cover || "";
    $("#song-mood").value = track.mood || "Chill";
  }
  $("#song-dialog").showModal();
}

function deleteTrack(id) {
  const track = tracks.find(item => item.id === id);
  if (!track || !window.confirm(`Bạn có chắc muốn xóa "${track.title}" khỏi thư viện?`)) return;
  tracks = tracks.filter(item => item.id !== id);
  if (currentTrackId === id) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    currentTrackId = null;
    $("#player-title").textContent = "Chọn một giai điệu";
    $("#player-artist").textContent = "Bài hát của bạn đang chờ";
    $("#player-cover").innerHTML = "<span>♫</span>";
    $("#play-button").textContent = "▶";
  }
  const saved = saveTracks();
  render();
  if (saved) showToast("Đã xóa bài hát khỏi thư viện.");
}

function setupEvents() {
  document.addEventListener("click", event => {
    const target = event.target.closest("button, a");
    if (!target) {
      $$(".row-dropdown").forEach(menu => { menu.hidden = true; });
      return;
    }
    if (target.matches("[data-open-modal], #top-add-button")) {
      event.preventDefault();
      openSongDialog();
    } else if (target.matches("[data-go]")) {
      event.preventDefault();
      navigate(target.dataset.go);
    } else if (target.matches(".nav-link[data-page], .brand")) {
      event.preventDefault();
      navigate(target.dataset.page || "home");
    } else if (target.matches(".track-row")) {
      playTrack(tracks.find(track => track.id === target.dataset.trackId));
    } else if (target.matches(".row-play")) {
      playTrack(tracks.find(track => track.id === target.closest(".track-row").dataset.trackId));
    } else if (target.dataset.action === "favorite") {
      const track = tracks.find(item => item.id === target.closest(".track-row").dataset.trackId);
      if (track) {
        track.favorite = !track.favorite;
        saveTracks();
        render();
      }
      event.stopPropagation();
    } else if (target.dataset.action === "menu") {
      const currentMenu = $(".row-dropdown", target.parentElement);
      $$(".row-dropdown").forEach(menu => { if (menu !== currentMenu) menu.hidden = true; });
      currentMenu.hidden = !currentMenu.hidden;
      event.stopPropagation();
    } else if (target.dataset.action === "edit") {
      const track = tracks.find(item => item.id === target.closest(".track-row").dataset.trackId);
      if (track) openSongDialog(track);
    } else if (target.dataset.action === "delete") {
      deleteTrack(target.closest(".track-row").dataset.trackId);
    }
  });

  $("#search-input").addEventListener("input", render);
  $("#hero-play-button").addEventListener("click", () => {
    if (!tracks.length) return showToast("Hãy thêm bài hát vào thư viện trước nhé.");
    const track = tracks.find(item => item.id === currentTrackId) || tracks[0];
    playTrack(track);
  });
  $$(".mood-card").forEach(card => card.addEventListener("click", () => {
    navigate("library");
    const query = card.dataset.mood;
    $("#search-input").value = query;
    render();
    if (!tracks.some(track => track.mood === query)) showToast("Chưa có bài hát thuộc tâm trạng này.");
  }));
  $("#play-button").addEventListener("click", () => {
    if (!currentTrackId) return playTrack(tracks[0]);
    if (audio.paused) playTrack(tracks.find(track => track.id === currentTrackId));
    else audio.pause();
  });
  $("#previous-button").addEventListener("click", () => {
    if (audio.currentTime > 3) audio.currentTime = 0;
    else playNext(-1);
  });
  $("#next-button").addEventListener("click", () => playNext(1));
  $("#shuffle-button").addEventListener("click", event => {
    isShuffle = !isShuffle;
    event.currentTarget.classList.toggle("active", isShuffle);
    showToast(isShuffle ? "Đã bật phát ngẫu nhiên." : "Đã tắt phát ngẫu nhiên.");
  });
  $("#repeat-button").addEventListener("click", event => {
    repeatCurrent = !repeatCurrent;
    audio.loop = repeatCurrent;
    event.currentTarget.classList.toggle("active", repeatCurrent);
    showToast(repeatCurrent ? "Đang lặp lại bài hát hiện tại." : "Đã tắt lặp lại.");
  });
  $("#player-favorite").addEventListener("click", () => {
    const track = tracks.find(item => item.id === currentTrackId);
    if (!track) return;
    track.favorite = !track.favorite;
    saveTracks();
    render();
  });
  $("#progress-bar").addEventListener("input", event => {
    if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * Number(event.currentTarget.value) / 100;
  });
  $("#volume-bar").addEventListener("input", event => { audio.volume = Number(event.currentTarget.value); });
  audio.volume = Number($("#volume-bar").value);
  audio.addEventListener("timeupdate", () => {
    $("#current-time").textContent = formatTime(audio.currentTime);
    $("#duration").textContent = formatTime(audio.duration);
    if (Number.isFinite(audio.duration)) $("#progress-bar").value = String(audio.currentTime / audio.duration * 100);
  });
  audio.addEventListener("loadedmetadata", () => {
    const track = tracks.find(item => item.id === currentTrackId);
    if (track) {
      track.duration = formatTime(audio.duration);
      saveTracks();
      $$(".track-row").forEach(row => {
        if (row.dataset.trackId === track.id) $(".track-duration", row).textContent = track.duration;
      });
    }
    $("#duration").textContent = formatTime(audio.duration);
  });
  audio.addEventListener("play", () => {
    $("#play-button").textContent = "Ⅱ";
    $("#play-button").setAttribute("aria-label", "Tạm dừng");
    render();
  });
  audio.addEventListener("pause", () => {
    $("#play-button").textContent = "▶";
    $("#play-button").setAttribute("aria-label", "Phát nhạc");
    render();
  });
  audio.addEventListener("ended", () => { if (!repeatCurrent) playNext(1); });

  $("#song-form").addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const existingId = String(formData.get("id") || "");
    const audioUrl = String(formData.get("audio") || "").trim();
    const coverUrl = String(formData.get("cover") || "").trim();
    if (!/^https?:\/\//i.test(audioUrl) || (coverUrl && !/^https?:\/\//i.test(coverUrl))) {
      $("#song-error").textContent = "Đường dẫn audio và ảnh bìa phải bắt đầu bằng http:// hoặc https://.";
      return;
    }
    const data = {
      id: existingId || (crypto.randomUUID ? crypto.randomUUID() : `song-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      title: String(formData.get("title")).trim(),
      artist: String(formData.get("artist")).trim(),
      audio: audioUrl,
      cover: coverUrl,
      mood: String(formData.get("mood") || "Chill"),
      duration: existingId ? (tracks.find(track => track.id === existingId)?.duration || "") : "",
      favorite: existingId ? Boolean(tracks.find(track => track.id === existingId)?.favorite) : false
    };
    const existingIndex = tracks.findIndex(track => track.id === existingId);
    if (existingIndex >= 0) tracks[existingIndex] = data;
    else tracks.unshift(data);
    if (currentTrackId === data.id) {
      const wasPlaying = !audio.paused;
      updateNowPlaying(data);
      if (data.audio !== audio.src) {
        audio.src = data.audio;
        if (wasPlaying) {
          audio.play().catch(error => {
            console.error("Không thể phát bài hát sau khi cập nhật:", error);
            showToast("Đã lưu thay đổi nhưng không phát được audio mới.");
          });
        }
      }
    }
    const saved = saveTracks();
    render();
    if (!saved) return;
    $("#song-dialog").close();
    showToast(existingIndex >= 0 ? "Đã cập nhật bài hát." : "Đã thêm bài hát vào thư viện.");
  });

  $("#close-dialog").addEventListener("click", () => $("#song-dialog").close());
  $("#cancel-dialog").addEventListener("click", () => $("#song-dialog").close());
  $("#song-dialog").addEventListener("click", event => {
    if (event.target === $("#song-dialog")) $("#song-dialog").close();
  });
  $("#contact-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const name = $("#contact-name").value.trim();
    $("#contact-feedback").textContent = `Cảm ơn ${name}! Đây là bản demo giao diện; lời nhắn chưa được gửi đến máy chủ.`;
    form.reset();
  });
  $("#back-button").addEventListener("click", () => history.back());
  $("#forward-button").addEventListener("click", () => history.forward());
  window.addEventListener("popstate", () => navigate(location.hash.slice(1) || "home"));
  window.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#search-input").focus();
    }
    if (event.code === "Space" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName) && !$("#song-dialog").open) {
      event.preventDefault();
      $("#play-button").click();
    }
    if (event.key === "Escape") $$(".row-dropdown").forEach(menu => { menu.hidden = true; });
  });
  $("#queue-button").addEventListener("click", () => navigate("library"));
}

setupEvents();
render();
navigate(location.hash.slice(1) || "home");
$("#current-year").textContent = String(new Date().getFullYear());
