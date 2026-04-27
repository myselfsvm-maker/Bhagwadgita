/* ============================================================
   Bhagavad Gita — Main Script
   Handles: Language toggle, Daily Shloka, Chapter rendering,
            Quotes, Scroll-to-top, Copy, Toast notifications
   ============================================================ */

// ── Global State ──────────────────────────────────────────
let currentLang = localStorage.getItem('gita-lang') || 'en';
let currentShlokaIndex = null;

// ── Initialization ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyLangUI(currentLang);

  const page = document.body.dataset.page || 'home';

  if (page === 'home') {
    initHomePage();
  } else if (page === 'chapter') {
    initChapterPage();
  }

  initScrollTop();
});

// ── Language Toggle ───────────────────────────────────────
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('gita-lang', lang);
  applyLangUI(lang);
  refreshMeanings();
  showToast(lang === 'en' ? '🇬🇧 Switched to English' : '🇮🇳 हिंदी में बदला गया');
}

function applyLangUI(lang) {
  const btnEn = document.getElementById('btn-en');
  const btnHi = document.getElementById('btn-hi');
  if (btnEn) {
    btnEn.classList.toggle('active', lang === 'en');
    btnEn.setAttribute('aria-pressed', lang === 'en');
  }
  if (btnHi) {
    btnHi.classList.toggle('active', lang === 'hi');
    btnHi.setAttribute('aria-pressed', lang === 'hi');
  }

  // Update label
  const label = document.getElementById('meaning-lang-label');
  if (label) {
    label.textContent = lang === 'en' ? 'Meaning (English)' : 'अर्थ (हिंदी)';
  }
}

function refreshMeanings() {
  // Refresh Daily Shloka meaning
  if (currentShlokaIndex !== null) {
    const allShlokas = getAllShlokas();
    const shloka = allShlokas[currentShlokaIndex];
    if (shloka) updateDailyMeaning(shloka);
  }

  // Refresh shloka card meanings on chapter page
  document.querySelectorAll('.shloka-meaning-text').forEach(el => {
    const enText = el.dataset.en;
    const hiText = el.dataset.hi;
    if (enText && hiText) {
      el.textContent = currentLang === 'en' ? enText : hiText;
    }
  });

  // Refresh meaning-lang labels everywhere
  document.querySelectorAll('.meaning-lang-label').forEach(el => {
    el.textContent = currentLang === 'en' ? 'Meaning (English)' : 'अर्थ (हिंदी)';
  });
}

// ── Collect All Shlokas (flat list) ──────────────────────
function getAllShlokas() {
  const all = [];
  gitaData.chapters.forEach(ch => {
    ch.shlokas.forEach(sh => {
      all.push({ ...sh, chapterId: ch.id, chapterTitle: ch.title });
    });
  });
  return all;
}

// ── Home Page ─────────────────────────────────────────────
function initHomePage() {
  document.body.dataset.page = 'home';
  randomizeShloka();
  renderQuotes();
  renderChaptersGrid();
}

function randomizeShloka() {
  const all = getAllShlokas();
  let idx;
  do {
    idx = Math.floor(Math.random() * all.length);
  } while (idx === currentShlokaIndex && all.length > 1);

  currentShlokaIndex = idx;
  const shloka = all[idx];

  const verseIdEl    = document.getElementById('daily-verse-id');
  const sanskritEl   = document.getElementById('daily-sanskrit');
  const transEl      = document.getElementById('daily-transliteration');
  const meaningEl    = document.getElementById('daily-meaning');
  const labelEl      = document.getElementById('meaning-lang-label');

  if (!verseIdEl) return;

  // Fade out
  [verseIdEl, sanskritEl, transEl].forEach(el => {
    if (el) { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; }
  });

  setTimeout(() => {
    verseIdEl.textContent = `Chapter ${shloka.verse.split('.')[0]}, Verse ${shloka.verse.split('.')[1]} — ${shloka.chapterTitle}`;
    sanskritEl.textContent = shloka.sanskrit;
    transEl.textContent    = shloka.transliteration;
    updateDailyMeaning(shloka);
    if (labelEl) labelEl.textContent = currentLang === 'en' ? 'Meaning (English)' : 'अर्थ (हिंदी)';

    // Fade in
    [verseIdEl, sanskritEl, transEl].forEach(el => {
      if (el) {
        el.style.transition = 'opacity .4s ease, transform .4s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }
    });
  }, 200);
}

function updateDailyMeaning(shloka) {
  const el = document.getElementById('daily-meaning');
  if (el) {
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = currentLang === 'en' ? shloka.meaning_en : shloka.meaning_hi;
      el.style.transition = 'opacity .3s ease';
      el.style.opacity = '1';
    }, 150);
  }
}

function copyDailyShloka() {
  const all = getAllShlokas();
  if (currentShlokaIndex === null) return;
  const s = all[currentShlokaIndex];
  const text = `${s.sanskrit}\n\n${s.transliteration}\n\n${currentLang === 'en' ? s.meaning_en : s.meaning_hi}\n\n— Bhagavad Gita ${s.verse}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Shloka copied to clipboard!');
  }).catch(() => {
    showToast('❗ Could not copy. Please select manually.');
  });
}

// ── Render Quotes ─────────────────────────────────────────
function renderQuotes() {
  const grid = document.getElementById('quotes-grid');
  if (!grid) return;

  grid.innerHTML = gitaData.quotes.map((q, i) => `
    <article class="quote-card" role="listitem" style="animation-delay:${i * .1}s">
      <div class="quote-mark" aria-hidden="true">"</div>
      <p class="quote-text">${q.text}</p>
      <div class="quote-author">
        <div class="author-avatar" aria-hidden="true">${q.author.charAt(0)}</div>
        <div class="author-info">
          <strong>${q.author}</strong>
          <span>${q.role}</span>
        </div>
      </div>
    </article>
  `).join('');
}

// ── Render Chapters Grid ──────────────────────────────────
function renderChaptersGrid() {
  const grid = document.getElementById('chapters-grid');
  if (!grid) return;

  grid.innerHTML = gitaData.chapters.map((ch, i) => `
    <a href="chapters/chapter${ch.id}.html"
       class="chapter-card"
       aria-label="Chapter ${ch.id}: ${ch.title}"
       style="animation: fadeInUp .4s ease ${i * 0.04}s both">
      <div class="chapter-card-top" style="background:linear-gradient(90deg,${ch.color},${lighten(ch.color,20)})"></div>
      <div class="chapter-card-body">
        <div class="chapter-number" style="color:${ch.color}22;-webkit-text-stroke:1px ${ch.color}88">
          ${String(ch.id).padStart(2,'0')}
        </div>
        <div class="chapter-name">${ch.title}</div>
        <div class="chapter-subtitle">${ch.subtitle}</div>
        <p class="chapter-desc">${ch.description}</p>
      </div>
      <div class="chapter-card-footer">
        <span class="chapter-shloka-count">
          <i class="fa-regular fa-file-lines" aria-hidden="true"></i>
          ${ch.shlokas.length} Shlokas (Sample)
        </span>
        <span class="chapter-arrow" aria-hidden="true">
          <i class="fa-solid fa-chevron-right"></i>
        </span>
      </div>
    </a>
  `).join('');
}

// ── Chapter Page ──────────────────────────────────────────
function initChapterPage() {
  const chapterIdEl = document.getElementById('chapter-id-data');
  if (!chapterIdEl) return;
  const chId = parseInt(chapterIdEl.value, 10);
  const chapter = gitaData.chapters.find(c => c.id === chId);
  if (!chapter) return;

  // Hero
  document.querySelector('.chapter-hero').setAttribute('data-chapter-num', String(chId).padStart(2,'0'));
  document.getElementById('ch-num-badge').textContent = `Chapter ${chId} of 18`;
  document.getElementById('ch-title').textContent = chapter.title;
  document.getElementById('ch-subtitle').textContent = chapter.subtitle;
  document.getElementById('ch-description').textContent = chapter.description;
  document.title = `Chapter ${chId}: ${chapter.title} — Bhagavad Gita`;

  // Shlokas
  const container = document.getElementById('shlokas-container');
  if (!container) return;

  container.innerHTML = chapter.shlokas.map((sh, i) => `
    <article class="shloka-card" style="animation-delay:${i * .1}s" aria-label="Verse ${sh.verse}">
      <div class="shloka-card-header" style="background:linear-gradient(135deg,${chapter.color},${darken(chapter.color,20)})">
        <span class="shloka-verse-id">
          <i class="fa-solid fa-om" aria-hidden="true"></i>
          Verse ${sh.verse}
        </span>
        <button class="shloka-expand-btn"
                onclick="toggleShloka(this)"
                aria-expanded="true"
                aria-label="Collapse verse ${sh.verse}">
          <i class="fa-solid fa-compress" aria-hidden="true"></i> Collapse
        </button>
      </div>
      <div class="shloka-card-body shloka-body-content">
        <p class="sanskrit-text shloka-sanskrit" lang="sa">${sh.sanskrit}</p>
        <div class="divider-lotus" aria-hidden="true"><span>🪷</span></div>
        <p class="transliteration-text shloka-transliteration">${sh.transliteration}</p>
        <div class="shloka-meaning">
          <div class="meaning-label">
            <i class="fa-solid fa-book-open" aria-hidden="true"></i>
            <span class="meaning-lang-label">${currentLang === 'en' ? 'Meaning (English)' : 'अर्थ (हिंदी)'}</span>
          </div>
          <p class="shloka-meaning-text"
             data-en="${escapeHtml(sh.meaning_en)}"
             data-hi="${escapeHtml(sh.meaning_hi)}">
            ${currentLang === 'en' ? sh.meaning_en : sh.meaning_hi}
          </p>
        </div>
      </div>
    </article>
  `).join('');

  // Prev / Next nav
  buildChapterNav(chId);
}

function toggleShloka(btn) {
  const body = btn.closest('.shloka-card').querySelector('.shloka-body-content');
  const isOpen = btn.getAttribute('aria-expanded') === 'true';
  if (isOpen) {
    body.style.display = 'none';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<i class="fa-solid fa-expand" aria-hidden="true"></i> Expand';
  } else {
    body.style.display = 'block';
    btn.setAttribute('aria-expanded', 'true');
    btn.innerHTML = '<i class="fa-solid fa-compress" aria-hidden="true"></i> Collapse';
  }
}

function buildChapterNav(currentId) {
  const nav = document.getElementById('chapter-prev-next');
  if (!nav) return;
  const prev = currentId > 1  ? currentId - 1 : null;
  const next = currentId < 18 ? currentId + 1 : null;

  nav.innerHTML = `
    <div class="chapter-prev-next">
      ${prev ? `<a href="chapter${prev}.html" class="btn btn-outline">
          <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
          Chapter ${prev}
        </a>` : '<span></span>'}
      <a href="../index.html" class="btn btn-primary">
        <i class="fa-solid fa-house" aria-hidden="true"></i> Home
      </a>
      ${next ? `<a href="chapter${next}.html" class="btn btn-outline">
          Chapter ${next}
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </a>` : '<span></span>'}
    </div>
  `;
}

// ── Scroll to Top ─────────────────────────────────────────
function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ── Utility: Color Helpers ────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}

function lighten(hex, pct) {
  try {
    const [r,g,b] = hexToRgb(hex);
    const f = pct/100;
    return `rgb(${Math.min(255,r+Math.round((255-r)*f))},${Math.min(255,g+Math.round((255-g)*f))},${Math.min(255,b+Math.round((255-b)*f))})`;
  } catch { return hex; }
}

function darken(hex, pct) {
  try {
    const [r,g,b] = hexToRgb(hex);
    const f = 1 - pct/100;
    return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
  } catch { return hex; }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
