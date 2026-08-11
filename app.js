/**
 * Time Com Jesus - Plataforma de Vídeos Cristãos
 * Configuração XAMPP (Localhost / MySQL) + Modo Híbrido LocalStorage
 */

// 1. Estado Global da Aplicação
let appState = {
  videos: [],
  currentUser: null,
  isAdmin: false,
  activeCategory: "Todos",
  searchQuery: "",
  comments: {},
  favorites: [],
  registeredUsers: [],
  playQueue: [],
  currentPlayingVideoId: null,
  autoPlayNext: true,
  isPhpBackendAvailable: false
};

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'api' : 'https://facilit-mat.onrender.com/api';
let tempProfileAvatarDataUrl = null;
let ytPlayer = null;

// Carregar YouTube IFrame API globalmente
if (!window.YT) {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  if (firstScriptTag && firstScriptTag.parentNode) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
}

function onYouTubeIframeAPIReady() {}

// Vídeos Padrão Iniciais para Modo Local
const INITIAL_LOCAL_VIDEOS = [];

// 2. Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  loadRegisteredUsersLocal();
  loadUserSession();
  renderCategories();
  await initDataStore();
  setupEventListeners();
  setupPlayerCloseListener();
  setupModalPreloadListeners();
  setupAdminModalListeners();
});

function setupPlayerCloseListener() {
  const playerModalEl = document.getElementById('playerModal');
  if (playerModalEl) {
    playerModalEl.addEventListener('hidden.bs.modal', () => {
      const containerEl = document.getElementById("playerContainer");
      if (containerEl) {
        containerEl.innerHTML = '';
      }
      ytPlayer = null;
    });
  }
}

function setupAdminModalListeners() {
  const adminPassModalEl = document.getElementById('adminPassModal');
  if (adminPassModalEl) {
    adminPassModalEl.addEventListener('hidden.bs.modal', () => {
      const passInput = document.getElementById("adminPasswordInput");
      if (passInput) passInput.value = "";
    });
    adminPassModalEl.addEventListener('show.bs.modal', () => {
      const passInput = document.getElementById("adminPasswordInput");
      if (passInput) passInput.value = "";
    });
  }
}

function setupModalPreloadListeners() {
  const uploadModalEl = document.getElementById('uploadModal');
  if (uploadModalEl) {
    uploadModalEl.addEventListener('show.bs.modal', () => {
      const churchInput = document.getElementById("uploadChurch");
      if (appState.currentUser && churchInput && !churchInput.value) {
        churchInput.value = appState.currentUser.church || "";
      }
    });
  }
}

// 3. Gerenciamento de Usuários Registrados (Modo Local)
function loadRegisteredUsersLocal() {
  const saved = localStorage.getItem("tcj_registered_users");
  if (saved) {
    try {
      appState.registeredUsers = JSON.parse(saved);
    } catch (e) {
      appState.registeredUsers = [];
    }
  } else {
    appState.registeredUsers = [];
  }
}

function saveRegisteredUsersLocal() {
  localStorage.setItem("tcj_registered_users", JSON.stringify(appState.registeredUsers));
}

// Carregar Sessão do Usuário
function loadUserSession() {
  const savedUser = localStorage.getItem("tcj_current_user");
  if (savedUser) {
    try {
      appState.currentUser = JSON.parse(savedUser);
      updateUserNavUI();
    } catch (e) {
      localStorage.removeItem("tcj_current_user");
      appState.currentUser = null;
    }
  }

  const isAdmin = localStorage.getItem("tcj_is_admin");
  if (isAdmin === "true") {
    appState.isAdmin = true;
    updateAdminUI();
  }

  const savedFavs = localStorage.getItem("tcj_favorites");
  if (savedFavs) {
    try { appState.favorites = JSON.parse(savedFavs); } catch (e) {}
  }

  const savedComments = localStorage.getItem("tcj_comments");
  if (savedComments) {
    try { appState.comments = JSON.parse(savedComments); } catch (e) {}
  }
}

// 4. Inicialização de Dados (XAMPP MySQL ou LocalStorage)
async function initDataStore() {
  if (window.location.protocol === 'file:') {
    appState.isPhpBackendAvailable = false;
    loadVideosFromLocalStorage();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/get_videos.php?category=${encodeURIComponent(appState.activeCategory)}&search=${encodeURIComponent(appState.searchQuery)}`);
    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        if (result.success) {
          appState.isPhpBackendAvailable = true;
          appState.videos = result.videos || [];
          renderFeaturedBanner();
          renderVideoGrid();
          return;
        }
      }
    }
  } catch (e) {}

  appState.isPhpBackendAvailable = false;
  loadVideosFromLocalStorage();
}

function loadVideosFromLocalStorage() {
  const localSaved = localStorage.getItem("tcj_videos");
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      appState.videos = parsed.length > 0 ? parsed : INITIAL_LOCAL_VIDEOS;
    } catch (e) {
      appState.videos = INITIAL_LOCAL_VIDEOS;
    }
  } else {
    appState.videos = INITIAL_LOCAL_VIDEOS;
    saveLocalVideos();
  }
  renderFeaturedBanner();
  renderVideoGrid();
}

function saveLocalVideos() {
  try {
    localStorage.setItem("tcj_videos", JSON.stringify(appState.videos));
  } catch (e) {
    console.error("Quota do LocalStorage excedida!", e);
  }
}

// 5. Categorias
const CATEGORIES = ["Todos", "Pregações", "Estudos Bíblicos", "Louvor & Adoração", "Testemunhos", "Jovens", "Infantil"];

function renderCategories() {
  const container = document.getElementById("categoriesContainer");
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => `
    <button class="category-chip ${cat === appState.activeCategory ? 'active' : ''}" 
            onclick="selectCategory('${cat}')">
      ${cat}
    </button>
  `).join('');
}

function selectCategory(category) {
  appState.activeCategory = category;
  renderCategories();
  if (appState.isPhpBackendAvailable) {
    initDataStore();
  } else {
    renderVideoGrid();
  }
}

// 6. Pregação em Destaque
function renderFeaturedBanner() {
  const container = document.getElementById("featuredBannerContainer");
  if (!container) return;

  let filtered = filterVideosList();
  const featured = filtered.find(v => Number(v.is_featured) === 1 || v.isFeatured) || filtered[0];
  if (!featured) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  const views = Number(featured.views || 0).toLocaleString('pt-BR');
  const thumb = featured.thumb_url || featured.thumb || 'https://images.unsplash.com/photo-1509021436468-d510074671b4?q=80&w=800';

  container.innerHTML = `
    <div class="featured-banner" style="background-image: linear-gradient(90deg, #0b0f19 0%, rgba(15, 23, 42, 0.75) 60%, transparent 100%), url('${escapeHtml(thumb)}');">
      <span class="featured-badge"><i class="bi bi-star-fill me-1"></i> Pregação em Destaque</span>
      <h2 class="featured-title">${escapeHtml(featured.title)}</h2>
      <div class="featured-meta">
        <span><i class="bi bi-person-fill text-warning me-1"></i> <strong>${escapeHtml(featured.preacher)}</strong></span>
        <span>•</span>
        <span><i class="bi bi-building me-1"></i> ${escapeHtml(featured.church || 'Igreja Local')}</span>
        <span>•</span>
        <span><i class="bi bi-eye me-1"></i> ${views} visualizações</span>
      </div>
      <button class="btn btn-gold btn-lg" onclick="openPlayerModal('${featured.id}')">
        <i class="bi bi-play-circle-fill fs-5 me-1"></i> Assistir Agora
      </button>
    </div>
  `;
}

// 7. Grid de Vídeos
function filterVideosList() {
  return appState.videos.filter(v => {
    const matchesCat = appState.activeCategory === "Todos" || v.category === appState.activeCategory;
    const matchesQuery = appState.searchQuery === "" || 
      v.title.toLowerCase().includes(appState.searchQuery.toLowerCase()) ||
      v.preacher.toLowerCase().includes(appState.searchQuery.toLowerCase()) ||
      (v.church && v.church.toLowerCase().includes(appState.searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });
}

function canUserEditVideo(video) {
  if (appState.isAdmin) return true;
  if (!appState.currentUser) return false;

  if (video.user_id && String(video.user_id) === String(appState.currentUser.id)) {
    return true;
  }
  if (video.author_email && video.author_email === appState.currentUser.email) {
    return true;
  }
  return false;
}

function getUserAvatarForVideo(v) {
  if (appState.currentUser && (
      (v.user_id && String(v.user_id) === String(appState.currentUser.id)) ||
      (v.author_email && v.author_email === appState.currentUser.email)
  )) {
    return appState.currentUser.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150";
  }

  return v.avatar_url || v.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150";
}

function getUserNameForVideo(v) {
  return v.preacher || "Preletor / Cantor";
}

function renderVideoGrid() {
  const container = document.getElementById("videoGrid");
  if (!container) return;

  const list = filterVideosList();

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-camera-video display-1 text-warning mb-3"></i>
        <h3 class="text-white font-brand mb-2">Nenhuma pregação ou louvor enviado ainda</h3>
        <p class="text-secondary max-w-md mx-auto mb-4">Seja o primeiro a publicar um vídeo inspirador no Time Com Jesus!</p>
        <button class="btn btn-gold btn-lg" data-bs-toggle="modal" data-bs-target="#uploadModal">
          <i class="bi bi-cloud-upload-fill me-2"></i> Enviar Pregação / Louvor
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(v => {
    const views = Number(v.views || 0).toLocaleString('pt-BR');
    const thumb = v.thumb_url || v.thumb || 'https://images.unsplash.com/photo-1509021436468-d510074671b4?q=80&w=800';
    const avatar = getUserAvatarForVideo(v);
    const preacherName = getUserNameForVideo(v);
    const canEdit = canUserEditVideo(v);

    return `
      <div class="video-card" onclick="openPlayerModal('${v.id}')">
        <div class="thumb-wrapper">
          <img src="${escapeHtml(thumb)}" alt="${escapeHtml(v.title)}" class="thumb-img" onerror="this.src='https://images.unsplash.com/photo-1509021436468-d510074671b4?q=80&w=800'">
          <span class="category-tag">${escapeHtml(v.category || 'Pregações')}</span>
          <span class="duration-tag"><i class="bi bi-clock me-1"></i>${escapeHtml(v.duration || 'Vídeo')}</span>
          <div class="play-overlay">
            <div class="play-btn-circle">
              <i class="bi bi-play-fill ms-1"></i>
            </div>
          </div>
        </div>
        <div class="video-info">
          <div class="d-flex align-items-start gap-2.5 w-100">
            <!-- Foto do Autor -->
            <img src="${escapeHtml(avatar)}" class="preacher-avatar" alt="${escapeHtml(preacherName)}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'">
            <div class="video-details w-100 overflow-hidden">
              <h3 class="video-title">${escapeHtml(v.title)}</h3>
              
              <!-- Nome do Preletor ou Cantor -->
              <div class="d-flex align-items-center gap-1.5 mb-1">
                <span class="video-preacher fw-bold text-warning">${escapeHtml(preacherName)}</span>
              </div>
              
              <div class="video-church">${escapeHtml(v.church || 'Igreja Local')}</div>
              <div class="video-meta d-flex justify-content-between align-items-center mt-2">
                <span>${views} visualizações</span>
                <div class="d-flex gap-1" onclick="event.stopPropagation();">
                  <button class="btn btn-sm btn-outline-light py-0 px-2" title="Adicionar à Fila de Reprodução" onclick="addToPlayQueue('${v.id}')">
                    <i class="bi bi-plus-lg"></i> + Fila
                  </button>
                  ${canEdit ? `
                    <button class="btn btn-sm btn-outline-warning py-0 px-2" title="Editar Minha Pregação" onclick="openEditModal('${v.id}')">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger py-0 px-2" title="Apagar Pregação" onclick="deleteVideoUserOrAdmin('${v.id}')">
                      <i class="bi bi-trash"></i>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 8. Player & Auto-Avanço
function onVideoPlaybackEnded() {
  if (appState.autoPlayNext) {
    playNextInQueue();
  }
}

async function openPlayerModal(videoId) {
  const video = appState.videos.find(v => String(v.id) === String(videoId));
  if (!video) return;

  appState.currentPlayingVideoId = videoId;
  ytPlayer = null;

  if (appState.playQueue.length === 0 || String(appState.playQueue[0].id) !== String(videoId)) {
    const existingIndex = appState.playQueue.findIndex(v => String(v.id) === String(videoId));
    if (existingIndex !== -1) {
      appState.playQueue.splice(existingIndex, 1);
    }
    appState.playQueue.unshift(video);
  }

  video.views = Number(video.views || 0) + 1;
  if (appState.isPhpBackendAvailable) {
    try {
      await fetch(`${API_BASE}/admin_actions.php?action=view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId })
      });
    } catch (e) {}
  } else {
    saveLocalVideos();
  }

  const titleEl = document.getElementById("playerModalTitle");
  const containerEl = document.getElementById("playerContainer");
  const detailsEl = document.getElementById("playerDetails");

  if (titleEl) titleEl.textContent = video.title;

  const urlStr = video.video_url || video.videoUrl || '';
  let mediaHtml = '';

  if (urlStr.includes('youtube.com') || urlStr.includes('youtu.be')) {
    let ytId = '';
    const match = urlStr.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) ytId = match[1];

    mediaHtml = `<div id="ytPlayerContainer" class="w-100 h-100"></div>`;
    if (containerEl) containerEl.innerHTML = mediaHtml;

    setTimeout(() => {
      if (window.YT && window.YT.Player && ytId) {
        ytPlayer = new YT.Player('ytPlayerContainer', {
          height: '100%',
          width: '100%',
          videoId: ytId,
          playerVars: { 'autoplay': 1, 'rel': 0 },
          events: {
            'onStateChange': (event) => {
              if (event.data === YT.PlayerState.ENDED) {
                onVideoPlaybackEnded();
              }
            }
          }
        });
      } else {
        if (containerEl) {
          containerEl.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        }
      }
    }, 400);

  } else {
    mediaHtml = `
      <video id="html5VideoPlayer" controls autoplay class="w-100 h-100" onended="onVideoPlaybackEnded()">
        <source src="${escapeHtml(urlStr)}" type="video/mp4">
        Seu navegador não suporta a reprodução deste vídeo.
      </video>
    `;
    if (containerEl) containerEl.innerHTML = mediaHtml;
  }

  const canEdit = canUserEditVideo(video);
  const avatar = getUserAvatarForVideo(video);
  const preacherName = getUserNameForVideo(video);

  if (detailsEl) {
    detailsEl.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div class="d-flex align-items-center gap-3">
          <img src="${escapeHtml(avatar)}" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid var(--gold);" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'">
          <div>
            <h4 class="h5 mb-1 text-white">${escapeHtml(video.title)}</h4>
            <div class="text-warning fw-semibold mb-1"><i class="bi bi-person-circle me-1"></i> Preletor / Cantor: ${escapeHtml(preacherName)} • <span class="text-white-50">${escapeHtml(video.church || 'Igreja Local')}</span></div>
            <small class="text-muted">${Number(video.views).toLocaleString('pt-BR')} visualizações</small>
          </div>
        </div>
        ${canEdit ? `
          <div class="d-flex gap-2">
            <button class="btn btn-outline-warning btn-sm" onclick="openEditModal('${video.id}')">
              <i class="bi bi-pencil me-1"></i> Editar
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteVideoUserOrAdmin('${video.id}')">
              <i class="bi bi-trash me-1"></i> Apagar
            </button>
          </div>
        ` : ''}
      </div>
      <div class="p-3 bg-dark rounded border border-secondary border-opacity-25 mb-4">
        <h6 class="text-warning mb-2"><i class="bi bi-text-paragraph me-1"></i> Descrição da Mensagem</h6>
        <p class="text-secondary small mb-0">${escapeHtml(video.description || 'Sem descrição cadastrada.')}</p>
      </div>

      <!-- Seção de Comentários -->
      <h5 class="h6 text-white mb-3"><i class="bi bi-chat-left-text me-2 text-warning"></i> Comentários e Testemunhos</h5>
      <div class="d-flex gap-2 mb-3">
        <input type="text" id="newCommentInput" class="form-control form-dark" placeholder="Escreva um comentário edificante...">
        <button class="btn btn-gold" onclick="postCommentPHP('${video.id}')"><i class="bi bi-send-fill"></i></button>
      </div>
      <div id="commentsListContainer" class="comments-list">
        <p class="text-muted small">Carregando comentários...</p>
      </div>
    `;
  }

  loadCommentsPHP(video.id);
  renderPlayerQueueUI();
  populateQueueDropdownSelect();

  const modal = new bootstrap.Modal(document.getElementById('playerModal'));
  modal.show();
}

// Renderizar Fila de Reprodução
function renderPlayerQueueUI() {
  const container = document.getElementById("playerQueueContainer");
  if (!container) return;

  if (appState.playQueue.length === 0) {
    container.innerHTML = `<p class="text-muted small mb-0 p-2">Nenhuma pregação na fila. Escolha vídeos abaixo para adicionar.</p>`;
    return;
  }

  container.innerHTML = appState.playQueue.map((v, index) => {
    const isPlaying = String(v.id) === String(appState.currentPlayingVideoId);
    const thumb = v.thumb_url || v.thumb || 'https://images.unsplash.com/photo-1509021436468-d510074671b4?q=80&w=800';

    return `
      <div class="queue-item ${isPlaying ? 'active-playing' : ''} mb-2">
        <span class="queue-order-badge">${index + 1}</span>
        <img src="${escapeHtml(thumb)}" class="queue-thumb" onerror="this.src='https://images.unsplash.com/photo-1509021436468-d510074671b4?q=80&w=800'">
        <div class="overflow-hidden w-100">
          <p class="queue-title" title="${escapeHtml(v.title)}">${escapeHtml(v.title)}</p>
          <p class="queue-preacher">${isPlaying ? '▶ Tocando Agora' : escapeHtml(v.preacher)}</p>
        </div>
        <div class="d-flex gap-1 flex-shrink-0">
          ${!isPlaying ? `
            <button class="btn btn-sm btn-gold p-1 py-0" title="Tocar Agora" onclick="playQueueIndexNow(${index})">
              <i class="bi bi-play-fill"></i>
            </button>
          ` : ''}
          <button class="btn btn-sm btn-outline-secondary p-1 py-0 text-white" title="Subir Ordem" onclick="moveQueueItem(${index}, -1)" ${index === 0 ? 'disabled' : ''}>
            <i class="bi bi-arrow-up"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary p-1 py-0 text-white" title="Descer Ordem" onclick="moveQueueItem(${index}, 1)" ${index === appState.playQueue.length - 1 ? 'disabled' : ''}>
            <i class="bi bi-arrow-down"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger p-1 py-0" title="Remover da Fila" onclick="removeFromQueue(${index})">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function populateQueueDropdownSelect() {
  const select = document.getElementById("addToQueueSelect");
  if (!select) return;

  const available = appState.videos.filter(v => String(v.id) !== String(appState.currentPlayingVideoId));

  if (available.length === 0) {
    select.innerHTML = `<option value="">Nenhuma outra pregação cadastrada</option>`;
    return;
  }

  select.innerHTML = `<option value="">Selecione uma pregação/louvor...</option>` + 
    available.map(v => `<option value="${v.id}">${escapeHtml(v.title)} (${escapeHtml(v.preacher)})</option>`).join('');
}

function addSelectedToQueue() {
  const select = document.getElementById("addToQueueSelect");
  if (!select || !select.value) return;

  addToPlayQueue(select.value);
  select.value = "";
}

function addToPlayQueue(videoId) {
  const video = appState.videos.find(v => String(v.id) === String(videoId));
  if (!video) return;

  const exists = appState.playQueue.some(v => String(v.id) === String(videoId));
  if (!exists) {
    appState.playQueue.push(video);
    renderPlayerQueueUI();
    alert(`"${video.title}" foi adicionada à sua Fila de Reprodução!`);
  } else {
    alert("Esta pregação já está na sua fila de reprodução.");
  }
}

function playQueueIndexNow(index) {
  if (index >= 0 && index < appState.playQueue.length) {
    const video = appState.playQueue[index];
    openPlayerModal(video.id);
  }
}

function playNextInQueue() {
  if (appState.playQueue.length <= 1) return;

  appState.playQueue.shift();

  if (appState.playQueue.length > 0) {
    const nextVideo = appState.playQueue[0];
    openPlayerModal(nextVideo.id);
  }
}

function moveQueueItem(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= appState.playQueue.length) return;

  const item = appState.playQueue.splice(index, 1)[0];
  appState.playQueue.splice(newIndex, 0, item);
  renderPlayerQueueUI();
}

function removeFromQueue(index) {
  appState.playQueue.splice(index, 1);
  renderPlayerQueueUI();
}

function toggleAutoPlayNext(checked) {
  appState.autoPlayNext = checked;
}

// 9. Comentários
function canUserDeleteComment(comment) {
  if (appState.isAdmin) return true;
  if (!appState.currentUser) return false;
  if (comment.user_name && comment.user_name === appState.currentUser.name) return true;
  if (comment.author && comment.author === appState.currentUser.name) return true;
  return false;
}

async function loadCommentsPHP(videoId) {
  const container = document.getElementById("commentsListContainer");
  if (!container) return;

  if (appState.isPhpBackendAvailable) {
    try {
      const res = await fetch(`${API_BASE}/comments.php?video_id=${videoId}`);
      const data = await res.json();
      if (data.success && data.comments.length > 0) {
        container.innerHTML = data.comments.map((c, idx) => {
          const canDelete = canUserDeleteComment(c);
          return `
            <div class="comment-item d-flex justify-content-between align-items-start mb-2">
              <div class="d-flex gap-2">
                <div class="comment-user-avatar">${escapeHtml(c.user_name.charAt(0).toUpperCase())}</div>
                <div>
                  <div class="d-flex align-items-center gap-2">
                    <strong class="text-white small">${escapeHtml(c.user_name)}</strong>
                    <small class="text-muted" style="font-size: 0.75rem;">${c.created_at || 'Recente'}</small>
                  </div>
                  <p class="text-secondary small mb-0 mt-1">${escapeHtml(c.comment_text)}</p>
                </div>
              </div>
              ${canDelete ? `
                <button class="btn btn-sm btn-link text-danger p-0 ms-2" title="Apagar Comentário" onclick="deleteCommentUserOrAdmin('${videoId}', ${c.id}, ${idx})">
                  <i class="bi bi-trash"></i>
                </button>
              ` : ''}
            </div>
          `;
        }).join('');
        return;
      }
    } catch (e) {}
  }

  const list = appState.comments[videoId] || [];
  if (list.length === 0) {
    container.innerHTML = `<p class="text-muted small italic">Seja o primeiro a deixar um comentário edificante nesta pregação!</p>`;
  } else {
    container.innerHTML = list.map((c, idx) => {
      const canDelete = canUserDeleteComment(c);
      return `
        <div class="comment-item d-flex justify-content-between align-items-start mb-2">
          <div class="d-flex gap-2">
            <div class="comment-user-avatar">${escapeHtml((c.author || c.user_name || 'U').charAt(0).toUpperCase())}</div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <strong class="text-white small">${escapeHtml(c.author || c.user_name)}</strong>
                <small class="text-muted" style="font-size: 0.75rem;">${c.date || 'Agora'}</small>
              </div>
              <p class="text-secondary small mb-0 mt-1">${escapeHtml(c.text || c.comment_text)}</p>
            </div>
          </div>
          ${canDelete ? `
            <button class="btn btn-sm btn-link text-danger p-0 ms-2" title="Apagar Comentário" onclick="deleteCommentUserOrAdmin('${videoId}', null, ${idx})">
              <i class="bi bi-trash"></i>
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
  }
}

async function postCommentPHP(videoId) {
  const input = document.getElementById("newCommentInput");
  if (!input || !input.value.trim()) return;

  const authorName = appState.currentUser ? appState.currentUser.name : "Irmão(ã) Visitante";
  const commentText = input.value.trim();

  if (appState.isPhpBackendAvailable) {
    try {
      const res = await fetch(`${API_BASE}/comments.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: videoId,
          user_name: authorName,
          comment_text: commentText
        })
      });
      const data = await res.json();
      if (data.success) {
        input.value = "";
        loadCommentsPHP(videoId);
        return;
      }
    } catch (e) {}
  }

  if (!appState.comments[videoId]) {
    appState.comments[videoId] = [];
  }
  appState.comments[videoId].unshift({
    author: authorName,
    text: commentText,
    date: "Agora mesmo"
  });
  localStorage.setItem("tcj_comments", JSON.stringify(appState.comments));
  input.value = "";
  loadCommentsPHP(videoId);
}

async function deleteCommentUserOrAdmin(videoId, commentId, commentIndex) {
  if (confirm("Tem certeza de que deseja apagar este comentário?")) {
    if (appState.isPhpBackendAvailable && commentId) {
      try {
        await fetch(`${API_BASE}/comments.php?action=delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment_id: commentId })
        });
      } catch (e) {}
    }

    if (appState.comments[videoId]) {
      appState.comments[videoId].splice(commentIndex, 1);
      localStorage.setItem("tcj_comments", JSON.stringify(appState.comments));
    }

    loadCommentsPHP(videoId);
  }
}

// 10. Apagar Vídeo (Garantido para Admin e Autores)
async function deleteVideoUserOrAdmin(videoId) {
  const targetIdStr = String(videoId);
  const video = appState.videos.find(v => String(v.id) === targetIdStr);
  
  if (!appState.isAdmin && video && !canUserEditVideo(video)) {
    alert("Você só tem permissão para apagar as pregações ou louvores que você mesmo publicou!");
    return;
  }

  const videoTitle = video ? video.title : "esta pregação";

  if (confirm(`Tem certeza de que deseja apagar "${videoTitle}"?`)) {
    if (appState.isPhpBackendAvailable) {
      try {
        await fetch(`${API_BASE}/admin_actions.php?action=delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ video_id: videoId })
        });
      } catch (e) {}
    }

    appState.videos = appState.videos.filter(v => String(v.id) !== targetIdStr);
    appState.playQueue = appState.playQueue.filter(v => String(v.id) !== targetIdStr);
    saveLocalVideos();

    const playerModalEl = document.getElementById('playerModal');
    const playerModal = bootstrap.Modal.getInstance(playerModalEl);
    if (playerModal) playerModal.hide();

    if (appState.isPhpBackendAvailable) {
      await initDataStore();
    } else {
      renderFeaturedBanner();
      renderVideoGrid();
    }

    if (document.getElementById("adminDashboardModal")) {
      renderAdminTable();
    }

    alert("Pregação/Louvor apagado com sucesso!");
  }
}

// 11. Envio de Pregações
let selectedLocalVideoFileUrl = null;

function handleLocalVideoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  selectedLocalVideoFileUrl = URL.createObjectURL(file);
  const statusEl = document.getElementById("uploadFileStatus");
  if (statusEl) {
    statusEl.innerHTML = `<span class="text-success fw-bold"><i class="bi bi-check-circle-fill me-1"></i> Vídeo selecionado: ${file.name} (${(file.size / (1024*1024)).toFixed(1)} MB)</span>`;
  }
}

function compressImageFile(file, maxWidth = 500, maxHeight = 500) {
  return new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function saveNewVideo() {
  let title = document.getElementById("uploadTitle").value.trim();
  let preacherInput = document.getElementById("uploadPreacher").value.trim();
  const church = document.getElementById("uploadChurch").value.trim();
  const category = document.getElementById("uploadCategory").value;
  const linkInput = document.getElementById("uploadLink").value.trim();
  const description = document.getElementById("uploadDescription").value.trim();
  const videoFileInput = document.getElementById("localVideoFile");
  const thumbFileInput = document.getElementById("uploadThumbFile");

  let preacherName = preacherInput;
  if (!preacherName && appState.currentUser) {
    preacherName = appState.currentUser.name;
  }

  let userAvatarUrl = appState.currentUser && appState.currentUser.avatar_url ? appState.currentUser.avatar_url : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150";

  let finalVideoUrl = selectedLocalVideoFileUrl || linkInput;

  if (!title || !preacherName || !finalVideoUrl) {
    alert("Por favor, preencha o Título, o Nome do Preletor/Cantor e selecione um arquivo de vídeo do computador ou insira um link!");
    return;
  }

  if (appState.isPhpBackendAvailable) {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("preacher", preacherName);
    formData.append("church", church || (appState.currentUser ? appState.currentUser.church : ''));
    formData.append("category", category);
    formData.append("video_link", linkInput);
    formData.append("description", description);
    formData.append("avatar_url", userAvatarUrl);
    if (appState.currentUser) {
      formData.append("user_id", appState.currentUser.id);
    }

    if (videoFileInput.files.length > 0) formData.append("video_file", videoFileInput.files[0]);
    if (thumbFileInput.files.length > 0) formData.append("thumb_file", thumbFileInput.files[0]);

    try {
      const res = await fetch(`${API_BASE}/upload_video.php`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        finishVideoUploadSuccess();
        initDataStore();
        return;
      }
    } catch (e) {}
  }

  let thumbDataUrl = await compressImageFile(thumbFileInput.files[0], 800, 450);

  const newVid = {
    id: "v_" + Date.now(),
    title: title,
    preacher: preacherName,
    church: church || (appState.currentUser ? appState.currentUser.church : "Igreja Local"),
    category: category || "Pregações",
    duration: "Nova",
    views: 1,
    likes: 1,
    date: "Hoje",
    thumb_url: thumbDataUrl || "https://images.unsplash.com/photo-1509021436468-d510074671b4?q=80&w=800",
    avatar_url: userAvatarUrl,
    video_url: finalVideoUrl,
    description: description,
    user_id: appState.currentUser ? appState.currentUser.id : null,
    author_email: appState.currentUser ? appState.currentUser.email : null,
    is_featured: 0
  };

  appState.videos.unshift(newVid);
  saveLocalVideos();
  finishVideoUploadSuccess();
  renderFeaturedBanner();
  renderVideoGrid();
}

function finishVideoUploadSuccess() {
  selectedLocalVideoFileUrl = null;
  document.getElementById("uploadVideoForm").reset();
  document.getElementById("uploadFileStatus").innerHTML = "";

  const modalEl = document.getElementById("uploadModal");
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();

  alert("Glória a Deus! Sua pregação/louvor foi publicado com sucesso no Time Com Jesus!");
}

// 12. Modal de Edição de Pregação
function openEditModal(videoId) {
  const video = appState.videos.find(v => String(v.id) === String(videoId));
  if (!video) return;

  if (!canUserEditVideo(video)) {
    alert("Você só pode editar as pregações ou louvores que você mesmo publicou!");
    return;
  }

  document.getElementById("editVideoId").value = video.id;
  document.getElementById("editTitle").value = video.title || "";
  document.getElementById("editCategory").value = video.category || "Pregações";
  document.getElementById("editPreacher").value = video.preacher || "";
  document.getElementById("editChurch").value = video.church || "";
  document.getElementById("editThumb").value = video.thumb_url || video.thumb || "";
  document.getElementById("editVideoLink").value = video.video_url || video.videoUrl || "";
  document.getElementById("editDescription").value = video.description || "";

  const playerModalEl = document.getElementById('playerModal');
  const playerModal = bootstrap.Modal.getInstance(playerModalEl);
  if (playerModal) playerModal.hide();

  const editModal = new bootstrap.Modal(document.getElementById('editModal'));
  editModal.show();
}

async function submitEditVideo() {
  const videoId = document.getElementById("editVideoId").value;
  const title = document.getElementById("editTitle").value.trim();
  const preacher = document.getElementById("editPreacher").value.trim();
  const church = document.getElementById("editChurch").value.trim();
  const category = document.getElementById("editCategory").value;
  const thumb_url = document.getElementById("editThumb").value.trim();
  const video_url = document.getElementById("editVideoLink").value.trim();
  const description = document.getElementById("editDescription").value.trim();

  if (!title || !preacher) {
    alert("Por favor, informe o Título e o Nome do Preletor/Cantor.");
    return;
  }

  if (appState.isPhpBackendAvailable) {
    try {
      const res = await fetch(`${API_BASE}/update_video.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: videoId,
          title,
          preacher,
          church,
          category,
          thumb_url,
          video_url,
          description
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Pregação atualizada com sucesso no banco de dados!");
        const modalEl = document.getElementById("editModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        initDataStore();
        return;
      }
    } catch (e) {}
  }

  const video = appState.videos.find(v => String(v.id) === String(videoId));
  if (video) {
    video.title = title;
    video.preacher = preacher;
    video.church = church;
    video.category = category;
    if (thumb_url) video.thumb_url = thumb_url;
    if (video_url) video.video_url = video_url;
    video.description = description;

    saveLocalVideos();
    alert("Pregação/Louvor editado com sucesso!");

    const modalEl = document.getElementById("editModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    renderFeaturedBanner();
    renderVideoGrid();
  }
}

// 13. Gestão de Perfil de Usuário & Foto de Perfil
function openProfileModal() {
  if (!appState.currentUser) {
    openAuthModal();
    return;
  }

  document.getElementById("profileName").value = appState.currentUser.name || "";
  document.getElementById("profileChurch").value = appState.currentUser.church || "";
  document.getElementById("profileNameDisplay").textContent = appState.currentUser.name;
  document.getElementById("profileEmailDisplay").textContent = appState.currentUser.email || "";
  document.getElementById("profileAvatarPreview").src = appState.currentUser.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150";

  tempProfileAvatarDataUrl = null;

  const modal = new bootstrap.Modal(document.getElementById("profileModal"));
  modal.show();
}

async function previewProfileAvatarFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  tempProfileAvatarDataUrl = await compressImageFile(file, 300, 300);
  const previewImg = document.getElementById("profileAvatarPreview");
  if (previewImg && tempProfileAvatarDataUrl) {
    previewImg.src = tempProfileAvatarDataUrl;
  }
}

async function saveUserProfile() {
  if (!appState.currentUser) return;

  const name = document.getElementById("profileName").value.trim();
  const church = document.getElementById("profileChurch").value.trim();
  const avatarFileInput = document.getElementById("profileAvatarFile");

  if (!name) {
    alert("Informe o seu nome!");
    return;
  }

  if (appState.isPhpBackendAvailable) {
    const formData = new FormData();
    formData.append("user_id", appState.currentUser.id);
    formData.append("name", name);
    formData.append("church", church);

    if (avatarFileInput && avatarFileInput.files.length > 0) {
      formData.append("avatar_file", avatarFileInput.files[0]);
    }

    try {
      const res = await fetch(`${API_BASE}/update_profile.php`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        appState.currentUser.name = name;
        appState.currentUser.church = church;
        if (data.user && data.user.avatar_url) {
          appState.currentUser.avatar_url = data.user.avatar_url;
        }
        localStorage.setItem("tcj_current_user", JSON.stringify(appState.currentUser));
        finishProfileSave();
        initDataStore();
        return;
      }
    } catch (e) {}
  }

  // Fallback Local Storage
  appState.currentUser.name = name;
  appState.currentUser.church = church;

  if (tempProfileAvatarDataUrl) {
    appState.currentUser.avatar_url = tempProfileAvatarDataUrl;
  }

  localStorage.setItem("tcj_current_user", JSON.stringify(appState.currentUser));

  saveLocalVideos();
  finishProfileSave();
}

function finishProfileSave() {
  updateUserNavUI();
  renderFeaturedBanner();
  renderVideoGrid();

  const modalEl = document.getElementById("profileModal");
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();

  alert("Perfil e Foto atualizados com sucesso!");
}

async function handleUserRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const church = document.getElementById("regChurch").value.trim();
  const password = document.getElementById("regPass").value.trim();
  const regAvatarFileInput = document.getElementById("regAvatarFile");

  let avatarDataUrl = null;
  if (regAvatarFileInput && regAvatarFileInput.files.length > 0) {
    avatarDataUrl = await compressImageFile(regAvatarFileInput.files[0], 300, 300);
  }

  if (appState.isPhpBackendAvailable) {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("church", church);
    formData.append("password", password);
    if (regAvatarFileInput && regAvatarFileInput.files.length > 0) {
      formData.append("avatar_file", regAvatarFileInput.files[0]);
    }

    try {
      const res = await fetch(`${API_BASE}/register.php`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        finishUserLogin(data.user);
        return;
      } else {
        alert("Erro no cadastro: " + data.message);
        return;
      }
    } catch (err) {}
  }

  const existing = appState.registeredUsers.find(u => u.email.toLowerCase() === email);
  if (existing) {
    alert("Este e-mail já está cadastrado! Por favor, faça login com a sua senha.");
    return;
  }

  const localUser = { 
    id: Date.now(), 
    name, 
    email, 
    password,
    church: church || "Comunidade Cristã",
    avatar_url: avatarDataUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150"
  };

  appState.registeredUsers.push(localUser);
  saveRegisteredUsersLocal();
  finishUserLogin(localUser);
}

async function handleUserLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPass").value.trim();

  if (appState.isPhpBackendAvailable) {
    try {
      const res = await fetch(`${API_BASE}/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        finishUserLogin(data.user);
        return;
      } else {
        alert("Erro ao entrar: " + data.message);
        return;
      }
    } catch (err) {}
  }

  const user = appState.registeredUsers.find(u => u.email.toLowerCase() === email && u.password === password);
  if (user) {
    finishUserLogin(user);
  } else {
    alert("E-mail ou senha incorretos! Se ainda não tem uma conta, clique na aba 'Cadastrar'.");
  }
}

// 14. Recuperação de Senha
function openResetPassModal() {
  const authModalEl = document.getElementById('authModal');
  const authModal = bootstrap.Modal.getInstance(authModalEl);
  if (authModal) authModal.hide();

  const resetModal = new bootstrap.Modal(document.getElementById('resetPassModal'));
  resetModal.show();
}

async function handleResetPassword() {
  const email = document.getElementById("resetEmail").value.trim().toLowerCase();
  const newPassword = document.getElementById("resetNewPass").value.trim();

  if (!email || !newPassword) {
    alert("Por favor, preencha o e-mail e a nova senha.");
    return;
  }

  if (appState.isPhpBackendAvailable) {
    try {
      const res = await fetch(`${API_BASE}/reset_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, new_password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert("Senha redefinida com sucesso! Você já pode entrar com a nova senha.");
        const resetModalEl = document.getElementById('resetPassModal');
        const resetModal = bootstrap.Modal.getInstance(resetModalEl);
        if (resetModal) resetModal.hide();
        openAuthModal();
        return;
      } else {
        alert("Erro: " + data.message);
        return;
      }
    } catch (e) {}
  }

  const user = appState.registeredUsers.find(u => u.email.toLowerCase() === email);
  if (user) {
    user.password = newPassword;
    saveRegisteredUsersLocal();
    alert("Sua senha foi alterada com sucesso! Entre agora usando a nova senha.");
    const resetModalEl = document.getElementById('resetPassModal');
    const resetModal = bootstrap.Modal.getInstance(resetModalEl);
    if (resetModal) resetModal.hide();
    openAuthModal();
  } else {
    alert("Este e-mail não foi encontrado no sistema. Verifique a digitação ou crie uma nova conta.");
  }
}

function finishUserLogin(user) {
  appState.currentUser = user;
  localStorage.setItem("tcj_current_user", JSON.stringify(user));
  updateUserNavUI();
  renderVideoGrid();

  const modalEl = document.getElementById('authModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

function logoutUser() {
  appState.currentUser = null;
  localStorage.removeItem("tcj_current_user");
  updateUserNavUI();
  renderVideoGrid();
}

function updateUserNavUI() {
  const area = document.getElementById("userNavArea");
  if (!area) return;

  if (appState.currentUser) {
    const avatar = appState.currentUser.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150";
    area.innerHTML = `
      <div class="d-flex align-items-center gap-2 p-1 px-2 rounded-pill bg-dark border border-secondary border-opacity-50" style="cursor: pointer;" onclick="openProfileModal()" title="Ver Meu Perfil">
        <img src="${escapeHtml(avatar)}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--gold);" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'">
        <span class="text-warning small fw-bold d-none d-sm-inline">${escapeHtml(appState.currentUser.name)}</span>
      </div>
    `;
  } else {
    area.innerHTML = `
      <button class="btn btn-outline-light-custom" onclick="openAuthModal()">
        <i class="bi bi-person me-1"></i> Entrar
      </button>
    `;
  }
}

// 15. Painel Admin
function promptAdminPassword() {
  if (appState.isAdmin) {
    openAdminDashboardModal();
    return;
  }

  const passInput = document.getElementById("adminPasswordInput");
  if (passInput) passInput.value = "";

  const passModal = new bootstrap.Modal(document.getElementById('adminPassModal'));
  passModal.show();
}

function verifyAdminPassword() {
  const passInputEl = document.getElementById("adminPasswordInput");
  const passInput = passInputEl ? passInputEl.value : "";

  if (passInput === "admin123") {
    appState.isAdmin = true;
    localStorage.setItem("tcj_is_admin", "true");
    updateAdminUI();
    renderVideoGrid();

    if (passInputEl) passInputEl.value = "";

    const passModalEl = document.getElementById('adminPassModal');
    const passModal = bootstrap.Modal.getInstance(passModalEl);
    if (passModal) passModal.hide();

    openAdminDashboardModal();
  } else {
    alert("Senha incorreta de Administrador!");
    if (passInputEl) passInputEl.value = "";
  }
}

function logoutAdmin() {
  appState.isAdmin = false;
  localStorage.removeItem("tcj_is_admin");
  updateAdminUI();
  renderVideoGrid();

  const dashModalEl = document.getElementById('adminDashboardModal');
  const dashModal = bootstrap.Modal.getInstance(dashModalEl);
  if (dashModal) dashModal.hide();
}

function updateAdminUI() {
  const btn = document.getElementById("adminNavBtn");
  if (!btn) return;

  if (appState.isAdmin) {
    btn.classList.add("active");
    btn.innerHTML = `<i class="bi bi-shield-lock-fill text-warning me-1"></i> Painel Admin (Ativo)`;
  } else {
    btn.classList.remove("active");
    btn.innerHTML = `<i class="bi bi-shield-lock me-1"></i> Admin`;
  }
}

function openAdminDashboardModal() {
  renderAdminTable();
  renderAdminUsersTable();
  const modal = new bootstrap.Modal(document.getElementById('adminDashboardModal'));
  modal.show();
}

function renderAdminTable() {
  const tbody = document.getElementById("adminTableBody");
  if (!tbody) return;

  if (appState.videos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nenhum vídeo postado ainda.</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.videos.map(v => `
    <tr>
      <td>
        <img src="${escapeHtml(v.thumb_url || v.thumb || 'https://images.unsplash.com/photo-1509021436468-d510074671b4?q=80&w=800')}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;" class="me-2">
        <strong class="text-white">${escapeHtml(v.title)}</strong>
      </td>
      <td>${escapeHtml(v.preacher)}</td>
      <td><span class="badge bg-secondary">${escapeHtml(v.category || 'Pregações')}</span></td>
      <td>${v.views || 0}</td>
      <td>
        ${Number(v.is_featured) === 1 || v.isFeatured ? `
          <span class="badge bg-warning text-dark me-1"><i class="bi bi-star-fill"></i> Destaque</span>
        ` : `
          <button class="btn btn-sm btn-outline-warning py-0 px-2 me-1" onclick="setFeaturedAdmin('${v.id}')">Destacar</button>
        `}
        <button class="btn btn-sm btn-outline-warning py-0 px-2 me-1" onclick="openEditModal('${v.id}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger py-0 px-2" onclick="deleteVideoUserOrAdmin('${v.id}')">
          <i class="bi bi-trash"></i> Excluir
        </button>
      </td>
    </tr>
  `).join('');
}

async function renderAdminUsersTable() {
  const tbody = document.getElementById("adminUsersTableBody");
  if (!tbody) return;

  let usersList = [];

  if (appState.isPhpBackendAvailable) {
    try {
      const res = await fetch(`${API_BASE}/admin_actions.php?action=get_users`);
      const data = await res.json();
      if (data.success) {
        usersList = data.users || [];
      }
    } catch (e) {}
  }

  if (usersList.length === 0) {
    usersList = appState.registeredUsers || [];
  }

  if (usersList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nenhum usuário cadastrado ainda.</td></tr>`;
    return;
  }

  tbody.innerHTML = usersList.map(u => {
    const avatar = u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150';
    const passwordDisplay = u.password || (u.password_hash ? '•••••••• (Criptografada)' : 'Definida no Cadastro');

    return `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img src="${escapeHtml(avatar)}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--gold);">
            <strong class="text-white">${escapeHtml(u.name)}</strong>
          </div>
        </td>
        <td><span class="text-warning font-monospace small">${escapeHtml(u.email)}</span></td>
        <td><code class="text-light bg-dark p-1 rounded border border-secondary border-opacity-50 small">${escapeHtml(passwordDisplay)}</code></td>
        <td>${escapeHtml(u.church || 'Igreja Local')}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="deleteUserAdmin('${u.id}')" title="Excluir Usuário e suas Pregações">
            <i class="bi bi-person-x"></i> Excluir
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteUserAdmin(userId) {
  const targetUser = (appState.registeredUsers || []).find(u => String(u.id) === String(userId));
  const userName = targetUser ? targetUser.name : "este usuário";

  if (confirm(`Tem certeza que deseja excluir a conta de "${userName}"? TODAS as pregações e louvores postados por este usuário serão apagados automaticamente!`)) {
    if (appState.isPhpBackendAvailable) {
      try {
        await fetch(`${API_BASE}/admin_actions.php?action=delete_user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId })
        });
      } catch (e) {}
    }

    appState.registeredUsers = appState.registeredUsers.filter(u => String(u.id) !== String(userId));
    saveRegisteredUsersLocal();

    appState.videos = appState.videos.filter(v => {
      if (v.user_id && String(v.user_id) === String(userId)) return false;
      if (targetUser && v.author_email && v.author_email.toLowerCase() === targetUser.email.toLowerCase()) return false;
      return true;
    });
    saveLocalVideos();

    renderAdminUsersTable();
    renderAdminTable();
    renderFeaturedBanner();
    renderVideoGrid();

    alert(`A conta de "${userName}" e todas as suas pregações foram excluídas com sucesso!`);
  }
}

async function setFeaturedAdmin(videoId) {
  if (appState.isPhpBackendAvailable) {
    try {
      await fetch(`${API_BASE}/admin_actions.php?action=set_featured`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId })
      });
    } catch (e) {}
  }

  appState.videos.forEach(v => {
    v.is_featured = (String(v.id) === String(videoId)) ? 1 : 0;
    v.isFeatured = (String(v.id) === String(videoId));
  });
  saveLocalVideos();
  renderFeaturedBanner();
  renderAdminTable();
  renderVideoGrid();
}

// 16. Event Listeners
function setupEventListeners() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      appState.searchQuery = e.target.value;
      renderVideoGrid();
    });
  }
}

function openAuthModal() {
  const modal = new bootstrap.Modal(document.getElementById('authModal'));
  modal.show();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
