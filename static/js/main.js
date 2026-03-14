// ── STATE ──
let favs    = JSON.parse(localStorage.getItem('ntv_favs')  || '[]');
let history = JSON.parse(localStorage.getItem('ntv_hist')  || '[]');
let currentProgram = null;
let currentTab = 'favs';

// ── BAŞLANGIÇ ──
document.addEventListener('DOMContentLoaded', () => {
  updateFavCount();
  markVisited();
  markFavStars();
  bindRows();
  bindFilters();
  bindButtons();
});

// ── SATIRLARA TIKLAMA ──
function bindRows() {
  document.querySelectorAll('.row').forEach(row => {
    row.addEventListener('click', async (e) => {
      if (e.target.classList.contains('fav-star')) return;
      const slug = row.dataset.slug;
      await openDrawer(slug);
    });
  });

  document.querySelectorAll('.fav-star').forEach(star => {
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      const slug = star.dataset.slug;
      toggleFavBySlug(slug, star);
    });
  });
}

// ── DRAWER ──
async function openDrawer(slug) {
  const res = await fetch('/api/programs');
  const programs = await res.json();
  const p = programs.find(x => x.slug === slug);
  if (!p) return;
  currentProgram = p;

  // header
  const thumb = document.getElementById('d-thumb');
  thumb.textContent = p.thumb;
  thumb.className = `d-thumb tc-${p.thumb_color}`;
  document.getElementById('d-title').textContent    = p.name;
  document.getElementById('d-years').textContent    = p.years;
  document.getElementById('d-channel').textContent  = p.channel;
  document.getElementById('d-genre').textContent    = p.genre;

  // favori butonu
  const favBtn = document.getElementById('d-fav-btn');
  const isFav = favs.some(f => f.slug === slug);
  favBtn.classList.toggle('active', isFav);
  favBtn.innerHTML = isFav ? '&#9733; Favorilerde' : '&#9733; Favoriye ekle';

  // izle butonu
  const ytBtn = document.getElementById('d-yt-btn');
  ytBtn.style.opacity = p.youtube_available ? '1' : '0.4';
  ytBtn.style.pointerEvents = p.youtube_available ? 'auto' : 'none';

  // embed sıfırla
  document.getElementById('embed-placeholder').style.display = 'flex';
  document.getElementById('embed-frame').style.display = 'none';
  document.getElementById('embed-frame').innerHTML = '';

  // kadro
  document.getElementById('d-cast').innerHTML = p.cast.map(c => `
    <div class="cast-row">
      <div class="cast-av">${c.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
      <div>
        <div class="cast-name">${c.name}</div>
        <div class="cast-role">${c.role}</div>
      </div>
    </div>`).join('');

  // geçmişe ekle
  addToHistory(p);

  // aç
  dimCols(true);
  document.getElementById('overlay').classList.add('show');
  document.getElementById('drawer').classList.add('open');
  document.getElementById('side-panel').classList.remove('open');
}

function closeDrawer() {
  dimCols(false);
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('embed-frame').innerHTML = '';
}

function playEmbed() {
  if (!currentProgram || !currentProgram.youtube_available) return;
  const firstEp = currentProgram.episodes?.[0];
  if (!firstEp?.youtube_id || firstEp.youtube_id === 'BURAYA_ID') {
    alert('YouTube ID henüz eklenmemiş.');
    return;
  }
  document.getElementById('embed-placeholder').style.display = 'none';
  document.getElementById('embed-frame').style.display = 'block';
  document.getElementById('embed-frame').innerHTML =
    `<iframe src="https://www.youtube.com/embed/${firstEp.youtube_id}?autoplay=1"
             allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
}

// ── FAVORİLER ──
function toggleFavBySlug(slug, starEl) {
  const isFav = favs.some(f => f.slug === slug);
  if (isFav) {
    favs = favs.filter(f => f.slug !== slug);
  } else {
    // program bilgisini satırdan al
    const row = document.querySelector(`.row[data-slug="${slug}"]`);
    if (row) {
      favs.push({
        slug,
        name: row.querySelector('.rname').textContent,
        meta: row.querySelector('.rmeta').textContent,
        thumb: row.querySelector('.rthumb').textContent.trim(),
        thumb_color: [...row.querySelector('.rthumb').classList]
          .find(c => c.startsWith('tc-'))?.replace('tc-', '') || 'purple'
      });
    }
  }
  localStorage.setItem('ntv_favs', JSON.stringify(favs));
  markFavStars();
  updateFavCount();
  if (currentTab === 'favs') renderSidePanel();

  // drawer favori butonunu da güncelle
  if (currentProgram?.slug === slug) {
    const favBtn = document.getElementById('d-fav-btn');
    const nowFav = favs.some(f => f.slug === slug);
    favBtn.classList.toggle('active', nowFav);
    favBtn.innerHTML = nowFav ? '&#9733; Favorilerde' : '&#9733; Favoriye ekle';
  }
}

function markFavStars() {
  document.querySelectorAll('.fav-star').forEach(star => {
    star.classList.toggle('on', favs.some(f => f.slug === star.dataset.slug));
  });
}

function updateFavCount() {
  document.getElementById('fav-count').textContent = favs.length;
}

// ── GEÇMİŞ ──
function addToHistory(p) {
  history = history.filter(h => h.slug !== p.slug);
  history.unshift({ slug: p.slug, name: p.name, meta: `${p.channel} · ${p.years}`, thumb: p.thumb, thumb_color: p.thumb_color });
  if (history.length > 30) history.pop();
  localStorage.setItem('ntv_hist', JSON.stringify(history));
  markVisited();
  if (currentTab === 'history') renderSidePanel();
}

function markVisited() {
  document.querySelectorAll('.row').forEach(row => {
    row.classList.toggle('visited', history.some(h => h.slug === row.dataset.slug));
  });
}

// ── SIDE PANEL ──
function toggleSidePanel(tab) {
  currentTab = tab;
  const panel = document.getElementById('side-panel');
  const isOpen = panel.classList.contains('open');
  if (isOpen && currentTab === tab) {
    closeSidePanel(); return;
  }
  switchTab(tab);
  dimCols(true);
  document.getElementById('overlay').classList.add('show');
  document.getElementById('drawer').classList.remove('open');
  panel.classList.add('open');
}

function closeSidePanel() {
  dimCols(false);
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('side-panel').classList.remove('open');
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-fav').classList.toggle('on', tab === 'favs');
  document.getElementById('tab-hist').classList.toggle('on', tab === 'history');
  renderSidePanel();
}

function renderSidePanel() {
  const list = currentTab === 'favs' ? favs : history;
  const body = document.getElementById('sp-body');
  if (!list.length) {
    body.innerHTML = `<div class="sp-empty">${currentTab === 'favs'
      ? 'Henüz favori eklemedin.\nBir programa ★ tıkla.'
      : 'Henüz bir program açmadın.'}</div>`;
    return;
  }
  body.innerHTML = list.map((p, i) => `
    <div class="sp-row" onclick="openDrawer('${p.slug}');closeSidePanel()">
      <div class="sp-thumb tc-${p.thumb_color}">${p.thumb}</div>
      <div style="flex:1;min-width:0">
        <div class="sp-rname">${p.name}</div>
        <div class="sp-rmeta">${p.meta}</div>
      </div>
      <span class="sp-remove" onclick="event.stopPropagation();removeItem(${i})">×</span>
    </div>`).join('');
}

function removeItem(i) {
  if (currentTab === 'favs') {
    favs.splice(i, 1);
    localStorage.setItem('ntv_favs', JSON.stringify(favs));
    markFavStars();
    updateFavCount();
  } else {
    history.splice(i, 1);
    localStorage.setItem('ntv_hist', JSON.stringify(history));
    markVisited();
  }
  renderSidePanel();
}

// ── SIRALAMA ──
function bindFilters() {
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const col   = pill.dataset.col;
      const sort  = pill.dataset.sort;
      const colEl = document.getElementById(`col-${col}`);

      pill.closest('.filters').querySelectorAll('.pill').forEach(p => p.classList.remove('on'));
      pill.classList.add('on');

      const rows = [...colEl.querySelectorAll('.row')];
      rows.sort((a, b) => {
        if (sort === 'az')   return a.querySelector('.rname').textContent.localeCompare(b.querySelector('.rname').textContent, 'tr');
        if (sort === 'year') return parseInt(a.dataset.year) - parseInt(b.dataset.year);
        return 0;
      });
      rows.forEach(r => colEl.appendChild(r));
    });
  });
}

// ── BUTONLAR ──
function bindButtons() {
  document.getElementById('overlay').addEventListener('click', () => {
    closeDrawer();
    closeSidePanel();
  });
  document.getElementById('drawer-close').addEventListener('click', closeDrawer);
  document.getElementById('sp-close').addEventListener('click', closeSidePanel);
  document.getElementById('play-btn').addEventListener('click', playEmbed);
  document.getElementById('d-yt-btn').addEventListener('click', playEmbed);
  document.getElementById('d-fav-btn').addEventListener('click', () => {
    if (currentProgram) toggleFavBySlug(currentProgram.slug, null);
  });
  document.getElementById('btn-favs').addEventListener('click', () => toggleSidePanel('favs'));
  document.getElementById('btn-history').addEventListener('click', () => toggleSidePanel('history'));
  document.getElementById('tab-fav').addEventListener('click', () => switchTab('favs'));
  document.getElementById('tab-hist').addEventListener('click', () => switchTab('history'));

  document.getElementById('btn-random').addEventListener('click', async () => {
    const res = await fetch('/api/random');
    const p   = await res.json();
    openDrawer(p.slug);
  });

  // arama
  document.getElementById('search-input').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.row').forEach(row => {
      const name = row.querySelector('.rname').textContent.toLowerCase();
      row.style.display = name.includes(q) ? '' : 'none';
    });
  });
}

// ── YARDIMCI ──
function dimCols(on) {
  document.querySelectorAll('.col').forEach(c => c.classList.toggle('dimmed', on));
}
