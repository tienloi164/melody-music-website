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
const serverConfig = window.MELODY || null;
let tracks = loadTracks();
let currentTrackId = null;
let isShuffle = false;
let repeatCurrent = false;
let toastTimeout;
let youtubeApiPromise = null;
let youtubePlayer = null;
let youtubePlayerReady = false;
let youtubeRequestedVideoId = null;
let youtubeProgressTimer = null;
let currentLyricIndex = -2;

function loadTracks() {
  if (serverConfig?.serverManaged) return serverConfig.tracks;
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
  if (serverConfig?.serverManaged) return true;
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
  const isPlaying = track.id === currentTrackId && (
    document.body.classList.contains("youtube-mode")
      ? youtubePlayerReady && youtubePlayer.getPlayerState() === window.YT.PlayerState.PLAYING
      : !audio.paused
  );
  const favoriteControl = serverConfig?.serverManaged
    ? serverConfig.authenticated
      ? `<form class="favorite-action-form" method="post" action="${serverConfig.favoriteUrlTemplate.replace("__SONG_ID__", encodeURIComponent(track.id))}"><input type="hidden" name="_token" value="${escapeHTML(serverConfig.csrfToken)}"><button type="submit" class="favorite-button${favoriteClass}" data-action="favorite" aria-label="${track.favorite ? "Bỏ yêu thích" : "Thêm yêu thích"}" title="${track.favorite ? "Bỏ yêu thích" : "Thêm yêu thích"}">${track.favorite ? "♥" : "♡"}</button></form>`
      : `<a class="favorite-button" href="${escapeHTML(serverConfig.loginUrl)}" aria-label="Đăng nhập để thêm yêu thích" title="Đăng nhập để thêm yêu thích">♡</a>`
    : `<button class="favorite-button${favoriteClass}" data-action="favorite" aria-label="${track.favorite ? "Bỏ yêu thích" : "Thêm yêu thích"}" title="${track.favorite ? "Bỏ yêu thích" : "Thêm yêu thích"}">${track.favorite ? "♥" : "♡"}</button>`;
  const rowMenu = serverConfig?.serverManaged
    ? serverConfig.admin
      ? `<div class="row-actions"><button class="row-menu-button" data-action="menu" aria-label="Tùy chọn bài hát">···</button><div class="row-dropdown" hidden><a data-action="edit" href="${serverConfig.adminEditUrlTemplate.replace("__SONG_ID__", encodeURIComponent(track.id))}">Chỉnh sửa</a><form method="post" action="${serverConfig.adminDeleteUrlTemplate.replace("__SONG_ID__", encodeURIComponent(track.id))}" onsubmit="return confirm('Bạn có chắc muốn xóa bài hát này?');"><input type="hidden" name="_token" value="${escapeHTML(serverConfig.csrfToken)}"><input type="hidden" name="_method" value="DELETE"><button class="delete-track" type="submit">Xóa bài hát</button></form></div></div>`
      : ""
    : `<div class="row-actions"><button class="row-menu-button" data-action="menu" aria-label="Tùy chọn bài hát">···</button><div class="row-dropdown" hidden><button data-action="edit">Chỉnh sửa</button><button class="delete-track" data-action="delete">Xóa bài hát</button></div></div>`;
  return `<article class="track-row${track.id === currentTrackId ? " is-playing" : ""}" data-track-id="${escapeHTML(track.id)}">
    <span class="track-index">${String(index + 1).padStart(2, "0")}</span>
    <button class="row-play" aria-label="${isPlaying ? "Tạm dừng" : "Phát"} ${escapeHTML(track.title)}">${isPlaying ? "Ⅱ" : "▶"}</button>
    <div class="track-cover">${coverMarkup(track)}</div>
    <div class="track-main"><strong>${escapeHTML(track.title)}</strong><span>${escapeHTML(track.artist)}</span></div>
    <span class="track-mood">${escapeHTML(track.mood || "Chill")}</span>
    <span class="track-duration">${escapeHTML(duration)}</span>
    ${favoriteControl}
    ${rowMenu}
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
  const playbackTime = document.body.classList.contains("youtube-mode") && youtubePlayerReady
    ? youtubePlayer.getCurrentTime()
    : audio.currentTime;
  updateLyrics(playbackTime);
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

async function toggleFavorite(track) {
  if (!track) return;
  if (!serverConfig?.serverManaged) {
    track.favorite = !track.favorite;
    saveTracks();
    render();
    return;
  }

  try {
    const response = await fetch(serverConfig.favoriteUrlTemplate.replace("__SONG_ID__", encodeURIComponent(track.id)), {
      method: "POST",
      headers: {
        "X-CSRF-TOKEN": serverConfig.csrfToken,
        Accept: "application/json"
      }
    });
    if (!response.ok) throw new Error(`Yêu thích thất bại (HTTP ${response.status}).`);
    const result = await response.json();
    track.favorite = result.favorite;
    render();
  } catch (error) {
    console.error("Không thể cập nhật bài hát yêu thích:", error);
    showToast("Không cập nhật được yêu thích. Hãy thử đăng nhập lại.");
  }
}

function updateNowPlaying(track) {
  $("#player-title").textContent = track.title;
  $("#player-artist").textContent = track.artist;
  const cover = $("#player-cover");
  cover.innerHTML = track.cover ? `<img src="${escapeHTML(track.cover)}" alt="">` : "<span>♫</span>";
  const image = $("img", cover);
  if (image) image.addEventListener("error", () => { cover.innerHTML = "<span>♫</span>"; }, { once: true });
}

function updateLyrics(time) {
  const track = tracks.find(item => item.id === currentTrackId);
  const lyrics = track?.lyrics || [];
  const display = $("#lyrics-display");
  display.hidden = !track;

  if (!track) {
    currentLyricIndex = -2;
    return;
  }

  let activeIndex = -1;
  for (let index = 0; index < lyrics.length; index += 1) {
    if (lyrics[index].time > time) break;
    activeIndex = index;
  }

  if (activeIndex === currentLyricIndex) return;
  currentLyricIndex = activeIndex;
  $("#lyrics-previous").textContent = activeIndex > 0 ? lyrics[activeIndex - 1].text : "";
  $("#lyrics-current").textContent = activeIndex >= 0
    ? lyrics[activeIndex].text
    : lyrics.length
      ? "♫"
      : "Chưa có lời đồng bộ cho bài hát này";
  $("#lyrics-next").textContent = lyrics[activeIndex + 1]?.text || "";
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function getYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    let videoId = null;

    if (host === "youtu.be" || host === "www.youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] || null;
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      videoId = parsed.searchParams.get("v");
      if (!videoId) {
        videoId = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] || null;
      }
    }

    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

function stopYouTubePlayer() {
  youtubeRequestedVideoId = null;
  clearInterval(youtubeProgressTimer);
  youtubeProgressTimer = null;
  if (youtubePlayerReady) youtubePlayer?.pauseVideo();
  $("#youtube-player-container").hidden = true;
  $(".player").classList.remove("youtube-mode");
  document.body.classList.remove("youtube-mode");
}

function setPlaybackState(isPlaying) {
  $("#play-button").textContent = isPlaying ? "Ⅱ" : "▶";
  $("#play-button").setAttribute("aria-label", isPlaying ? "Tạm dừng" : "Phát nhạc");
  render();
}

function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => reject(new Error("Không tải được YouTube IFrame API."));
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

async function loadYouTubeVideo(videoId) {
  youtubeRequestedVideoId = videoId;
  try {
    const youtube = await loadYouTubeAPI();
    if (!youtubePlayer) {
      youtubePlayer = new youtube.Player("youtube-player", {
        host: "https://www.youtube-nocookie.com",
        width: "100%",
        height: "100%",
        playerVars: {
          controls: 1,
          enablejsapi: 1,
          origin: location.origin,
          playsinline: 1,
          rel: 0
        },
        events: {
          onReady: event => {
            youtubePlayerReady = true;
            event.target.setVolume(Number($("#volume-bar").value) * 100);
            if (youtubeRequestedVideoId) event.target.loadVideoById(youtubeRequestedVideoId);
          },
          onStateChange: event => {
            if (!document.body.classList.contains("youtube-mode")) return;
            if (event.data === youtube.PlayerState.PLAYING) {
              clearInterval(youtubeProgressTimer);
              youtubeProgressTimer = setInterval(() => {
                if (!youtubePlayerReady || !document.body.classList.contains("youtube-mode")) return;
                const currentTime = youtubePlayer.getCurrentTime();
                const duration = youtubePlayer.getDuration();
                $("#current-time").textContent = formatTime(currentTime);
                $("#duration").textContent = formatTime(duration);
                if (duration > 0) $("#progress-bar").value = String(currentTime / duration * 100);
                updateLyrics(currentTime);
              }, 250);
              setPlaybackState(true);
            } else if (event.data === youtube.PlayerState.PAUSED || event.data === youtube.PlayerState.ENDED) {
              clearInterval(youtubeProgressTimer);
              youtubeProgressTimer = null;
              setPlaybackState(false);
              if (event.data === youtube.PlayerState.ENDED && document.body.classList.contains("youtube-mode")) {
                if (repeatCurrent) {
                  youtubePlayer.seekTo(0, true);
                  youtubePlayer.playVideo();
                } else {
                  playNext(1);
                }
              }
            }
          },
          onError: event => {
            console.error("YouTube không thể phát video:", event.data);
            showToast("Video YouTube không phát được hoặc chủ sở hữu đã tắt tính năng nhúng.");
          }
        }
      });
      return;
    }

    if (youtubePlayerReady && document.body.classList.contains("youtube-mode")) {
      youtubePlayer.loadVideoById(videoId);
    }
  } catch (error) {
    console.error("Không thể khởi tạo trình phát YouTube:", error);
    showToast("Không tải được trình phát YouTube. Hãy kiểm tra kết nối mạng.");
  }
}

function playTrack(track) {
  if (!track) return;
  const sameTrack = currentTrackId === track.id;
  const youtubeVideoId = getYouTubeVideoId(track.audio);

  if (youtubeVideoId) {
    if (sameTrack && document.body.classList.contains("youtube-mode")) {
      if (youtubePlayerReady) {
        if (youtubePlayer.getPlayerState() === window.YT.PlayerState.PLAYING) youtubePlayer.pauseVideo();
        else youtubePlayer.playVideo();
      }
      return;
    }
    audio.pause();
    currentTrackId = track.id;
    updateNowPlaying(track);
    $("#youtube-player-container").hidden = false;
    $(".player").classList.add("youtube-mode");
    document.body.classList.add("youtube-mode");
    $("#current-time").textContent = "0:00";
    $("#duration").textContent = "0:00";
    $("#progress-bar").value = "0";
    currentLyricIndex = -2;
    updateLyrics(0);
    loadYouTubeVideo(youtubeVideoId);
    render();
    return;
  }

  stopYouTubePlayer();
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
    stopYouTubePlayer();
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
      if (serverConfig?.serverManaged) {
        if (serverConfig.admin && serverConfig.adminCreateUrl) location.href = serverConfig.adminCreateUrl;
        else showToast("Chỉ admin mới có thể thêm bài hát.");
      } else {
        openSongDialog();
      }
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
      event.preventDefault();
      void toggleFavorite(track);
      event.stopPropagation();
    } else if (target.dataset.action === "menu") {
      const currentMenu = $(".row-dropdown", target.parentElement);
      $$(".row-dropdown").forEach(menu => { if (menu !== currentMenu) menu.hidden = true; });
      currentMenu.hidden = !currentMenu.hidden;
      event.stopPropagation();
    } else if (target.dataset.action === "edit") {
      if (serverConfig?.serverManaged) return;
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
    if (document.body.classList.contains("youtube-mode")) {
      if (!youtubePlayerReady) return;
      if (youtubePlayer.getPlayerState() === window.YT.PlayerState.PLAYING) youtubePlayer.pauseVideo();
      else youtubePlayer.playVideo();
      return;
    }
    if (audio.paused) playTrack(tracks.find(track => track.id === currentTrackId));
    else audio.pause();
  });
  $("#previous-button").addEventListener("click", () => {
    if (document.body.classList.contains("youtube-mode") && youtubePlayerReady) {
      if (youtubePlayer.getCurrentTime() > 3) youtubePlayer.seekTo(0, true);
      else playNext(-1);
      return;
    }
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
    void toggleFavorite(track);
  });
  $("#volume-bar").addEventListener("input", event => {
    audio.volume = Number(event.currentTarget.value);
    if (youtubePlayerReady && document.body.classList.contains("youtube-mode")) {
      youtubePlayer.setVolume(audio.volume * 100);
    }
  });
  audio.volume = Number($("#volume-bar").value);
  $("#progress-bar").addEventListener("input", event => {
    if (document.body.classList.contains("youtube-mode") && youtubePlayerReady) {
      const duration = youtubePlayer.getDuration();
      if (duration > 0) youtubePlayer.seekTo(duration * Number(event.currentTarget.value) / 100, true);
    } else if (Number.isFinite(audio.duration)) {
      audio.currentTime = audio.duration * Number(event.currentTarget.value) / 100;
    }
  });
  audio.addEventListener("timeupdate", () => {
    $("#current-time").textContent = formatTime(audio.currentTime);
    $("#duration").textContent = formatTime(audio.duration);
    if (Number.isFinite(audio.duration)) $("#progress-bar").value = String(audio.currentTime / audio.duration * 100);
    if (!document.body.classList.contains("youtube-mode")) updateLyrics(audio.currentTime);
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
    if (!document.body.classList.contains("youtube-mode")) setPlaybackState(true);
  });
  audio.addEventListener("pause", () => {
    if (!document.body.classList.contains("youtube-mode")) setPlaybackState(false);
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
