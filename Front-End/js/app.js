/**
 * DimmerTick - movies page (movies.html)
 *
 * Responsibilities:
 *   1. Load movies from the Spring Boot API (GET /api/movies).
 *   2. Normalize every movie so a missing or renamed field can never crash a renderer.
 *   3. Render the home sections (hero slider, selling fast, genres, rows, top rated, deals).
 *   4. Movie details view with showtimes and seat selection (booking is still a demo).
 *
 * Structure:
 *   CONFIG -> static data -> state -> utilities -> normalization -> renderers
 *   -> slider -> details -> seats -> views -> events -> init
 */
(() => {
  'use strict';

  // ===========================================================================
  // CONFIG
  // ===========================================================================
  const CONFIG = Object.freeze({
    api: '/api/movies',                      // same origin as the page, so no CORS needed
    imgBase: 'https://image.tmdb.org/t/p/',  // TMDB image CDN (small sizes load fast)
    fetchTimeoutMs: 10000,                   // give up on the API after 10 seconds
    price: 14,                               // ticket price in USD
    maxSeats: 8,                             // max seats per booking
    pageSize: 12,                            // movies per "Load more" click
    slideIntervalMs: 8000,                   // hero autoplay delay
    featuredCount: 6,                        // movies in the hero slider
    searchDebounceMs: 150,
    listStorageKey: 'dt-list'                // localStorage key for "My List"
  });

  // Only embed trailers from these hosts (blocks arbitrary iframes from bad data).
  const TRAILER_HOSTS = new Set([
    'www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'
  ]);

  // ===========================================================================
  // STATIC DATA (move to the backend later: /api/cinemas, /api/deals)
  // ===========================================================================
  const CINEMAS = [
    { n: 'AMC Empire 25', a: '234 W 42nd St, New York, NY 10036', t: ['10:30 AM', '1:45 PM', '5:00 PM', '8:15 PM'] },
    { n: 'Regal Times Square', a: '247 W 42nd St, New York, NY 10036', t: ['12:00 PM', '3:15 PM', '6:30 PM', '9:45 PM'] }
  ];
  const DEALS = [
    { t: 'Student Tuesday', d: '30% off every ticket with a valid student ID.', c: 'STUDENT30' },
    { t: 'Family Weekend', d: 'Book 3 tickets, get the 4th free (PG and below).', c: 'FAMILY4' },
    { t: 'Early Bird', d: '25% off all shows before 12 PM.', c: 'EARLY25' }
  ];
  const RULES = [
    ['clock', 'Arrive 15 minutes early. Late entry is not guaranteed once the film starts.'],
    ['shield', 'Age ratings are enforced. R-rated films need an adult or valid ID.'],
    ['ticket', 'Tickets can be refunded up to 2 hours before the showtime.'],
    ['bell', 'Keep phones silent. Recording or filming is not allowed.'],
    ['film', 'No outside food or drinks. Snacks are sold at the counter.']
  ];

  // ===========================================================================
  // UTILITIES
  // ===========================================================================
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  /** Escape text before it goes into an HTML template (prevents XSS from API data). */
  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

  /** Run one render step; if it throws, log it and keep the rest of the page alive. */
  const safeRun = (name, fn) => {
    try { fn(); } catch (err) { console.error(`[DimmerTick] "${name}" failed:`, err); }
  };

  /** localStorage can throw (private mode, quota). Never let that break the app. */
  const store = {
    read(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
    }
  };

  /** SVG icon from the sprite defined in the HTML (<symbol id="i-name">). */
  const ic = (name, cls = '') =>
      `<svg class="i ${esc(cls)}" aria-hidden="true"><use href="#i-${esc(name)}"/></svg>`;

  const debounce = (fn, ms) => {
    let id;
    return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
  };

  // ===========================================================================
  // DOM REFERENCES - looked up once; missing ones are reported at startup
  // ===========================================================================
  const dom = {
    home: $('#home'), details: $('#details'), toast: $('#toast'),
    hero: $('#hero'), heroPoster: $('#hero-poster'), heroTitle: $('#hero-title'),
    heroChips: $('#hero-chips'), heroText: $('#hero-text'), heroMeta: $('#hero-meta'),
    heroList: $('#hero-list'), heroWatch: $('#hero-watch'), dots: $('#dots'),
    prev: $('#prev'), next: $('#next'),
    hot: $('#hot'), hotSection: $('#hot-section'),
    grid: $('#grid'), gridTitle: $('#grid-title'), more: $('#more'),
    genres: $('#genres'), genresSection: $('#genres-section'), clearGenre: $('#clear-genre'),
    rows: $('#rows'), topList: $('#top-list'), deals: $('#deals'),
    sideNav: $('#side-nav'), search: $('#search')
  };

  // ===========================================================================
  // STATE
  // ===========================================================================
  const savedList = store.read(CONFIG.listStorageKey, []);
  const state = {
    movies: [],            // normalized movies from the API
    feat: [],              // movies shown in the hero slider
    view: 'home',          // 'home' | 'movies' | 'genres' | 'mylist'
    genre: '',             // active genre filter
    query: '',             // active search text
    slide: 0,              // current hero index
    timer: null,           // hero autoplay timer
    cur: null,             // movie open in the details view
    slot: null,            // chosen showtime { cin, time }
    seats: new Set(),      // selected seat ids
    shown: CONFIG.pageSize,// how many movies the main grid shows
    genreImg: {},          // stable random poster per genre tile
    list: Array.isArray(savedList) ? savedList.map(Number).filter(Number.isFinite) : []
  };

  // ===========================================================================
  // NORMALIZATION
  // The API (or a future database entity) may use different field names or miss
  // some fields. We convert every movie to one safe shape here, so renderers
  // never see undefined and one bad record never blanks the page.
  // ===========================================================================

  /** First defined value among several possible key names. */
  const pick = (raw, ...keys) => {
    for (const k of keys) if (raw[k] !== undefined && raw[k] !== null && raw[k] !== '') return raw[k];
    return undefined;
  };

  /** Accept an array or a comma-separated string. */
  const toList = (value, splitter = ',') => {
    if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(splitter).map((v) => v.trim()).filter(Boolean);
    return [];
  };

  const toNumberOrNull = (value) => {
    const n = Number(value);
    return value === undefined || value === null || value === '' || !Number.isFinite(n) ? null : n;
  };

  /** Poster path must look like "/abc123.jpg" - strips anything unexpected. */
  const cleanPoster = (value) => {
    const p = String(value ?? '').replace(/[^\w/.\-]/g, '');
    return p ? (p.startsWith('/') ? p : `/${p}`) : '';
  };

  /** Only allow https trailers from known hosts; turn watch?v= links into embed links. */
  const cleanTrailer = (value) => {
    if (!value) return '';
    try {
      const u = new URL(String(value));
      if (u.protocol !== 'https:' || !TRAILER_HOSTS.has(u.hostname)) return '';
      const watchId = u.pathname === '/watch' ? u.searchParams.get('v') : null;
      return watchId ? `${u.origin}/embed/${encodeURIComponent(watchId)}` : u.href;
    } catch { return ''; }
  };

  /** Dates are kept as "YYYY-MM-DD" or an empty string. */
  const cleanDate = (value) => {
    const s = String(value ?? '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
  };

  const cleanDuration = (value) =>
      typeof value === 'number' ? `${value} Min` : String(value ?? '').trim();

  /** Returns a safe movie object, or null if the record is unusable (no id or title). */
  function normalizeMovie(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const id = Number(pick(raw, 'id', 'movieId'));
    const title = String(pick(raw, 'title', 'name') ?? '').trim();
    if (!Number.isFinite(id) || !title) return null;

    const genres = toList(pick(raw, 'genre', 'genres'));
    const director = String(pick(raw, 'director') ?? 'Unknown').trim();
    const cast = toList(pick(raw, 'cast', 'actors'));

    return {
      id,
      title,
      poster: cleanPoster(pick(raw, 'poster', 'posterPath', 'poster_path')),
      genres: genres.length ? genres : ['Other'],
      age: String(pick(raw, 'age', 'ageRating', 'age_rating', 'rated') ?? 'NR').trim().toUpperCase(),
      imdb: toNumberOrNull(pick(raw, 'imdb', 'imdbRating', 'imdb_rating')),
      rottenTomatoes: toNumberOrNull(pick(raw, 'rottenTomatoes', 'rotten_tomatoes', 'rt')),
      releaseDate: cleanDate(pick(raw, 'releaseDate', 'release_date')),
      duration: cleanDuration(pick(raw, 'duration', 'runtime')),
      director,
      synopsis: String(pick(raw, 'synopsis', 'overview', 'description') ?? '').trim(),
      cast,
      awards: Array.isArray(raw.awards) ? toList(raw.awards) : toList(raw.awards, '\n'),
      trailer: cleanTrailer(pick(raw, 'trailer', 'trailerUrl', 'trailer_url')),
      // Lowercased text used by the search box
      search: [title, director, ...cast].join(' ').toLowerCase()
    };
  }

  // ===========================================================================
  // FORMATTERS
  // ===========================================================================
  const fmtDate = (s) => {
    if (!s) return 'TBA';
    const d = new Date(`${s}T00:00:00`);
    return Number.isNaN(d.getTime())
        ? 'TBA'
        : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const fmtYear = (m) => (m.releaseDate ? m.releaseDate.slice(0, 4) : '-');
  const fmtImdb = (m) => (m.imdb === null ? 'N/A' : m.imdb);
  const fmtRt = (m) => (m.rottenTomatoes === null ? 'N/A' : `${m.rottenTomatoes}%`);
  const initials = (name) => {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  };

  // Demo numbers - replace with real booking data from the backend.
  const sold = (m) => 35 + (m.id * 29) % 60;
  const lastHour = (m) => 20 + (m.id * 53) % 180;

  let toastTimer;
  function toast(message) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 2400);
  }

  // ===========================================================================
  // SHARED HTML PIECES
  // ===========================================================================
  const poster = (m, size = 'w342', cls = '', lazy = true) =>
      `<div class="pw ${esc(cls)}" data-t="${esc(m.title)}">${m.poster
          ? `<img src="${CONFIG.imgBase}${size}${m.poster}" alt="${esc(m.title)} poster" width="342" height="513" ${lazy ? 'loading="lazy"' : ''} decoding="async">`
          : ''}</div>`;

  const genresOf = (m) => m.genres;

  const ageChip = (m) =>
      `<span class="age a-${esc(m.age.replace(/[^A-Z0-9]/g, ''))}" title="Age rating">${esc(m.age)}</span>`;

  const rates = (m) =>
      `<span class="rate"><b>IMDb</b>${esc(fmtImdb(m))}</span>` +
      `<span class="rate" title="Rotten Tomatoes">${ic('tomato')}${esc(fmtRt(m))}</span>`;

  const card = (m, i = 0) => `
    <article class="card" style="--i:${Math.min(i, 12)}" data-id="${m.id}" tabindex="0">
      ${poster(m)}${ageChip(m)}
      <h3>${esc(m.title)}</h3>
      <p><span>${ic('star', 'st')} ${esc(fmtImdb(m))}</span><span class="rt-s">${ic('tomato')}${esc(fmtRt(m))}</span></p>
    </article>`;

  /** Count how many movies each genre has: { Action: 5, Drama: 8 }. */
  const genreCounts = () => {
    const count = {};
    state.movies.forEach((m) => genresOf(m).forEach((g) => { count[g] = (count[g] || 0) + 1; }));
    return count;
  };
  const genresByPopularity = () => {
    const count = genreCounts();
    return { count, names: Object.keys(count).sort((a, b) => count[b] - count[a]) };
  };

  /** Movies that pass the current search, genre and view filters. */
  const visible = () => {
    const q = state.query.toLowerCase();
    return state.movies.filter((m) =>
        (!q || m.search.includes(q)) &&
        (!state.genre || genresOf(m).includes(state.genre)) &&
        (state.view !== 'mylist' || state.list.includes(m.id)));
  };
  const isFiltering = () => !!(state.query || state.genre || state.view === 'mylist');

  // ===========================================================================
  // HOME RENDERERS
  // ===========================================================================
  function renderHero() {
    const m = state.feat[state.slide];
    if (!m) return;
    dom.hero.style.setProperty('--bg-img', m.poster ? `url("${CONFIG.imgBase}w342${m.poster}")` : 'none');
    dom.heroPoster.innerHTML = poster(m, 'w500', '', false);
    dom.heroTitle.textContent = m.title;
    dom.heroChips.innerHTML = ageChip(m) + rates(m);
    dom.heroText.textContent = m.synopsis;
    dom.heroMeta.textContent = `Directed by ${m.director}  |  ${fmtDate(m.releaseDate)}  |  ${m.duration || 'N/A'}`;
    dom.heroList.innerHTML = state.list.includes(m.id) ? `${ic('check')}In My List` : `${ic('plus')}My List`;
    dom.dots.innerHTML = state.feat.map((_, i) => `<i class="${i === state.slide ? 'on' : ''}"></i>`).join('');
    // Restart the CSS "swap" animation
    dom.hero.classList.remove('swap'); void dom.hero.offsetWidth; dom.hero.classList.add('swap');
  }

  function renderHot() {
    dom.hot.innerHTML = [...state.movies].sort((a, b) => sold(b) - sold(a)).slice(0, 6).map((m) => `
      <article class="hot" data-id="${m.id}">${poster(m, 'w154')}
        <div><h3>${esc(m.title)}</h3><p>${lastHour(m)} tickets in the last hour</p>
        <div class="bar"><i style="--w:${sold(m)}%"></i></div>
        <small>${sold(m)}% sold${sold(m) > 85 ? ' - almost full' : ''}</small></div></article>`).join('');
  }

  function renderGrid() {
    const items = visible();
    const filtering = isFiltering();
    const list = filtering ? items : items.slice(0, state.shown);

    dom.gridTitle.textContent = state.view === 'mylist' ? 'My List'
        : state.genre ? `${state.genre} (${items.length})` : 'Now showing';

    let emptyText = 'No movies match your search.';
    if (state.view === 'mylist') emptyText = 'Your list is empty. Add a movie with the My List button.';
    else if (!state.movies.length) emptyText = 'No movies available yet.';

    dom.grid.innerHTML = list.length
        ? list.map((m, i) => card(m, i)).join('')
        : `<p class="empty">${emptyText}</p>`;
    dom.more.hidden = filtering || state.shown >= items.length;
  }

  function renderGenres() {
    const { count, names } = genresByPopularity();
    dom.genres.innerHTML = names.map((g, i) => {
      const pool = state.movies.filter((m) => genresOf(m).includes(g));
      // Random poster per tile, but stable between re-renders
      const m = state.genreImg[g] || (state.genreImg[g] = pool[Math.floor(Math.random() * pool.length)]);
      return `<button class="genre g${i % 6}${state.genre === g ? ' on' : ''}" data-genre="${esc(g)}">
        ${m.poster ? `<img src="${CONFIG.imgBase}w185${m.poster}" alt="" loading="lazy" decoding="async">` : ''}
        <span class="g-name">${esc(g)}<small>${count[g]} movie${count[g] > 1 ? 's' : ''}</small></span></button>`;
    }).join('');
  }

  function renderRows() {
    const { names } = genresByPopularity();
    dom.rows.innerHTML = names.slice(0, 6).map((g) => `
      <section><div class="row-head"><h2>${esc(g)}</h2></div>
      <div class="rail-wrap">
        <button class="rail-btn l" data-dir="-1" aria-label="Scroll left" hidden>${ic('left')}</button>
        <div class="rail">${state.movies.filter((m) => genresOf(m).includes(g)).map((m, i) => card(m, i)).join('')}</div>
        <button class="rail-btn r" data-dir="1" aria-label="Scroll right">${ic('right')}</button>
      </div></section>`).join('');
  }

  /** Show or hide a rail's left/right arrows depending on scroll position. */
  const updateArrows = (rail) => {
    const wrap = rail.parentElement;
    const max = rail.scrollWidth - rail.clientWidth;
    wrap.querySelector('.l').hidden = rail.scrollLeft < 8;
    wrap.querySelector('.r').hidden = rail.scrollLeft > max - 8;
  };
  const updateAllArrows = () =>
      requestAnimationFrame(() => $$('.rail').forEach(updateArrows));

  function renderTop() {
    dom.topList.innerHTML = [...state.movies].sort((a, b) => (b.imdb ?? 0) - (a.imdb ?? 0)).slice(0, 5).map((m, i) => `
      <div class="top-item" data-id="${m.id}"><span class="rank">${i + 1}</span>${poster(m, 'w92')}
      <div><h4>${esc(m.title)}</h4><p>${esc(fmtYear(m))}</p><p>${ic('star', 'st')} ${esc(fmtImdb(m))}</p></div></div>`).join('');
  }

  function renderDeals() {
    dom.deals.innerHTML = DEALS.map((d) => `<div class="deal"><h4>${esc(d.t)}</h4><p>${esc(d.d)}</p>
      <button class="code" data-code="${esc(d.c)}">${ic('copy')}${esc(d.c)}</button></div>`).join('');
  }

  /** Show or hide sections for the current view/filter, then redraw the grid. */
  function refresh() {
    const filtering = isFiltering();
    dom.hero.hidden = filtering || state.view !== 'home' || !state.feat.length;
    dom.hotSection.hidden = filtering;
    dom.rows.hidden = filtering;
    dom.genresSection.hidden = state.view === 'mylist';
    renderGrid();
    updateAllArrows();
  }

  // ===========================================================================
  // HERO SLIDER
  // ===========================================================================
  const stopAutoplay = () => { clearInterval(state.timer); state.timer = null; };
  const startAutoplay = () => {
    stopAutoplay();
    if (state.feat.length > 1) state.timer = setInterval(() => goTo(state.slide + 1), CONFIG.slideIntervalMs);
  };

  function goTo(n) {
    if (!state.feat.length) return;
    state.slide = (n + state.feat.length) % state.feat.length;   // wraps around both ways
    renderHero();
    startAutoplay();                                             // restart the timer after any manual move
  }

  // ===========================================================================
  // DETAILS VIEW
  // ===========================================================================
  function openDetails(id) {
    const m = state.movies.find((x) => x.id === id);
    if (!m) return;
    state.cur = m; state.slot = null; state.seats.clear();

    // Next three days for the date picker
    const days = [0, 1, 2].map((i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return `<button class="date${i ? '' : ' on'}">${d.toLocaleDateString('en-US', { weekday: 'long' })}<span>${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></button>`;
    }).join('');

    const trailer = m.trailer
        ? `<iframe src="${esc(m.trailer)}" title="${esc(m.title)} trailer" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>`
        : `<div class="no-trailer">${ic('film')}<p>Trailer not added yet.</p><a class="btn ghost" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query=${encodeURIComponent(`${m.title} official trailer`)}">Search on YouTube</a></div>`;

    dom.details.innerHTML = `
      <button class="back" id="back-btn">${ic('left')}Back to movies</button>
      <div class="d-hero">
        <div class="trailer">${trailer}</div>
        <div class="d-info">
          <div class="chips">${ageChip(m)}${rates(m)}</div>
          <h1>${esc(m.title)}</h1>
          <dl class="facts">
            <div><dt>Director</dt><dd>${esc(m.director)}</dd></div><div><dt>Release date</dt><dd>${esc(fmtDate(m.releaseDate))}</dd></div>
            <div><dt>Runtime</dt><dd>${esc(m.duration || 'N/A')}</dd></div><div><dt>Genre</dt><dd>${esc(m.genres.join(', '))}</dd></div>
          </dl>
          <p class="muted">${esc(m.synopsis)}</p>
          ${m.age === 'R' ? `<p class="warn">${ic('shield')}Not suitable for children. ID may be checked at the door.</p>` : ''}
        </div>
        ${poster(m, 'w500', 'd-poster', false)}
      </div>
      <h2>Cast</h2>
      <div class="cast">${m.cast.length
        ? m.cast.map((c) => `<div><span class="av">${esc(initials(c))}</span>${esc(c)}</div>`).join('')
        : '<p class="muted">Cast not available.</p>'}</div>
      <h2>${ic('trophy')}Awards</h2>
      <ul class="awards">${m.awards.length
        ? m.awards.map((a) => `<li>${ic('trophy')}${esc(a)}</li>`).join('')
        : '<li class="muted">No awards listed.</li>'}</ul>
      <h2>Select date</h2><div class="dates" id="dates">${days}</div>
      <h2>Cinemas in New York</h2>
      ${CINEMAS.map((c, i) => `<details class="cinema"${i ? '' : ' open'}>
        <summary><div><strong>${esc(c.n)}</strong><small>${esc(c.a)}</small></div><span>Showtimes</span></summary>
        <div class="times">${c.t.map((t) => `<button data-cin="${esc(c.n)}" data-time="${esc(t)}">${esc(t)}</button>`).join('')}</div></details>`).join('')}
      <div id="seatbox" hidden></div>
      <h2>${ic('shield')}Cinema rules</h2>
      <ul class="rules">${RULES.map((r) => `<li>${ic(r[0])}${esc(r[1])}</li>`).join('')}</ul>`;

    dom.home.hidden = true;
    dom.details.hidden = false;
    window.scrollTo(0, 0);
  }

  function closeDetails() {
    if (dom.details.hidden) return;
    dom.details.innerHTML = '';          // removing the iframe also stops the trailer
    dom.details.hidden = true;
    dom.home.hidden = false;
  }

  // ===========================================================================
  // SEATS
  // ===========================================================================

  /** Deterministic "random" taken seats: the same showtime always gives the same map. */
  function isTaken(row, col, seed) {
    let x = seed ^ Math.imul(row + 1, 0x9E3779B1) ^ Math.imul(col + 1, 0x85EBCA6B);
    x = Math.imul(x ^ (x >>> 15), 0x2C1B3C6D);
    return ((x ^ (x >>> 12)) >>> 0) % 100 < 28;      // ~28% taken
  }

  function showSeats() {
    const { cin, time } = state.slot;
    const seed = [...`${state.cur.id}${cin}${time}`].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
    state.seats.clear();

    const rows = 'ABCDEFGH'.split('').map((letter, r) => `<div class="srow"><span>${letter}</span>${
        Array.from({ length: 10 }, (_, c) => {
          const id = letter + (c + 1);
          const taken = isTaken(r, c, seed);
          return `<button class="seat ${taken ? 'taken' : 'free'}" data-seat="${id}" ${taken ? 'disabled' : ''} aria-label="Seat ${id}${taken ? ', taken' : ''}"></button>`;
        }).join('')}</div>`).join('');

    const box = $('#seatbox');
    box.hidden = false;
    box.innerHTML = `<div class="seatbox">
      <h2>${ic('ticket')}Choose your seats</h2><p class="muted small" style="margin-bottom:20px">${esc(state.cur.title)} at ${esc(cin)}, ${esc(time)}</p>
      <div class="screen">SCREEN</div><div class="seats">${rows}</div>
      <div class="legend"><span><i class="seat free"></i>Available</span><span><i class="seat sel"></i>Selected</span><span><i class="seat taken"></i>Taken</span></div>
      <div class="sum"><div><span class="muted small">Seats</span><br><strong id="sum-seats">None yet</strong></div>
      <div><span class="muted small">Total</span><br><strong id="sum-total">$0</strong></div>
      <button class="btn grad" id="book" disabled>${ic('ticket')}Book tickets</button></div></div>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function updateSum() {
    const seats = [...state.seats];
    $('#sum-seats').textContent = seats.length ? seats.join(', ') : 'None yet';
    $('#sum-total').textContent = `$${seats.length * CONFIG.price}`;
    $('#book').disabled = !seats.length;
  }

  /** Demo booking. TODO: replace with POST /api/tickets { movieId, cinema, time, seats }. */
  function bookSeats() {
    const booked = [...state.seats].join(', ');
    state.seats.forEach((id) => {
      const btn = $(`[data-seat="${id}"]`);
      if (btn) { btn.className = 'seat taken'; btn.disabled = true; }
    });
    state.seats.clear();
    updateSum();
    toast(`Booked ${booked}. Enjoy the movie! (demo)`);
  }

  // ===========================================================================
  // VIEWS AND MY LIST
  // ===========================================================================
  function setView(view) {
    closeDetails();
    state.view = view;
    state.genre = '';
    renderGenres();
    $$('#side-nav a').forEach((a) => a.classList.toggle('active', a.dataset.view === view));
    refresh();
    if (view === 'genres') dom.genresSection.scrollIntoView({ behavior: 'smooth' });
  }

  function toggleList(id) {
    const i = state.list.indexOf(id);
    if (i > -1) state.list.splice(i, 1); else state.list.push(id);
    store.write(CONFIG.listStorageKey, state.list);
    renderHero();
    renderGrid();
    toast(i > -1 ? 'Removed from My List' : 'Added to My List');
  }

  // ===========================================================================
  // EVENTS (delegated: one listener per container, not per button)
  // ===========================================================================
  function bindEvents() {
    // Poster images that fail to load are removed (the .pw box shows the title instead)
    document.addEventListener('error', (e) => {
      if (e.target instanceof HTMLImageElement && e.target.closest('.pw, .genre')) e.target.remove();
    }, true);

    // ----- home: rails, cards, genre tiles, deal codes -----
    dom.home.addEventListener('click', (e) => {
      const railBtn = e.target.closest('.rail-btn');
      if (railBtn) {
        const rail = railBtn.parentElement.querySelector('.rail');
        rail.scrollBy({ left: Number(railBtn.dataset.dir) * rail.clientWidth * 0.85, behavior: 'smooth' });
        return;
      }
      const movie = e.target.closest('[data-id]');
      if (movie) return openDetails(Number(movie.dataset.id));

      const genre = e.target.closest('[data-genre]');
      if (genre) {
        state.genre = state.genre === genre.dataset.genre ? '' : genre.dataset.genre;
        renderGenres();
        refresh();
        if (state.genre) requestAnimationFrame(() => dom.gridTitle.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        return;
      }
      const code = e.target.closest('[data-code]');
      if (code) {
        navigator.clipboard?.writeText(code.dataset.code).catch(() => { /* clipboard blocked */ });
        toast(`Code ${code.dataset.code} copied`);
      }
    });

    // Enter key opens a focused card
    dom.home.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.target.closest('.card')?.click();
    });

    // ----- details: dates, showtimes, seats, booking -----
    dom.details.addEventListener('click', (e) => {
      if (e.target.closest('#back-btn')) return closeDetails();

      const date = e.target.closest('.date');
      if (date) {
        $$('.date').forEach((x) => x.classList.remove('on'));
        date.classList.add('on');
        if (state.slot) showSeats();            // a new date means a new seat map
        return;
      }

      const time = e.target.closest('[data-time]');
      if (time) {
        $$('.times button').forEach((x) => x.classList.remove('on'));
        time.classList.add('on');
        state.slot = { cin: time.dataset.cin, time: time.dataset.time };
        return showSeats();
      }

      const seat = e.target.closest('.seat.free, .seat.sel');
      if (seat && seat.dataset.seat) {
        const id = seat.dataset.seat;
        if (state.seats.has(id)) {
          state.seats.delete(id);
          seat.classList.replace('sel', 'free');
        } else if (state.seats.size >= CONFIG.maxSeats) {
          return toast(`You can book up to ${CONFIG.maxSeats} seats`);
        } else {
          state.seats.add(id);
          seat.classList.replace('free', 'sel');
        }
        return updateSum();
      }

      if (e.target.closest('#book')) bookSeats();
    });

    // ----- navigation, search, filters, paging -----
    dom.sideNav.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link) { e.preventDefault(); setView(link.dataset.view); }
    });
    dom.search.addEventListener('input', debounce((e) => {
      state.query = e.target.value.trim();
      closeDetails();
      refresh();
    }, CONFIG.searchDebounceMs));
    dom.clearGenre.addEventListener('click', () => { state.genre = ''; renderGenres(); refresh(); });
    dom.more.addEventListener('click', () => { state.shown += CONFIG.pageSize; renderGrid(); });

    // Scroll events do not bubble, so listen in the capture phase
    dom.rows.addEventListener('scroll', (e) => {
      if (e.target.classList?.contains('rail')) updateArrows(e.target);
    }, true);
    window.addEventListener('resize', debounce(updateAllArrows, 100));

    // ----- hero slider -----
    dom.prev.addEventListener('click', () => goTo(state.slide - 1));
    dom.next.addEventListener('click', () => goTo(state.slide + 1));
    dom.heroWatch.addEventListener('click', () => state.feat[state.slide] && openDetails(state.feat[state.slide].id));
    dom.heroList.addEventListener('click', () => state.feat[state.slide] && toggleList(state.feat[state.slide].id));
    // Pause autoplay while the user reads the hero or the tab is hidden
    dom.hero.addEventListener('mouseenter', stopAutoplay);
    dom.hero.addEventListener('mouseleave', startAutoplay);
    document.addEventListener('visibilitychange', () => (document.hidden ? stopAutoplay() : startAutoplay()));
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================
  async function loadMovies() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.fetchTimeoutMs);
    try {
      const res = await fetch(CONFIG.api, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Could not load movies from ${CONFIG.api} (HTTP ${res.status})`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Expected the API to return a JSON array of movies');

      const movies = data.map(normalizeMovie).filter(Boolean);
      const skipped = data.length - movies.length;
      if (skipped) console.warn(`[DimmerTick] Skipped ${skipped} movie(s) without a valid id or title.`);
      return movies;
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Warn (in the console) about movies that miss fields the UI likes to show. */
  function auditMovies(movies) {
    const missing = { poster: 0, releaseDate: 0, imdb: 0, rottenTomatoes: 0, synopsis: 0 };
    movies.forEach((m) => Object.keys(missing).forEach((k) => {
      if (m[k] === '' || m[k] === null) missing[k]++;
    }));
    const issues = Object.entries(missing).filter(([, n]) => n > 0);
    if (issues.length) {
      console.warn('[DimmerTick] Movies with missing fields (check the API JSON field names):',
          Object.fromEntries(issues));
    }
  }

  // ===========================================================================
  // INIT
  // ===========================================================================
  async function init() {
    // If the HTML is missing an element this script needs, say which one.
    const missing = Object.entries(dom).filter(([, el]) => !el).map(([name]) => name);
    if (missing.length) {
      console.error(`[DimmerTick] movies.html is missing elements for: ${missing.join(', ')}`);
      return;
    }

    bindEvents();
    safeRun('deals', renderDeals);          // static, so it shows even if the API fails

    try {
      state.movies = await loadMovies();
      auditMovies(state.movies);
    } catch (err) {
      console.error('[DimmerTick]', err);
      const timedOut = err.name === 'AbortError';
      dom.grid.innerHTML = `<p class="empty">${timedOut
          ? 'The server took too long to respond. Please try again.'
          : 'Could not load movies. Check that the Spring Boot backend is running on port 8080.'}</p>`;
      dom.hero.hidden = true;
      return;
    }

    state.feat = state.movies.slice(0, CONFIG.featuredCount);

    // Each step is isolated: one failing section cannot blank the others.
    safeRun('hot', renderHot);
    safeRun('genres', renderGenres);
    safeRun('rows', renderRows);
    safeRun('top', renderTop);
    safeRun('refresh', refresh);
    safeRun('hero', () => goTo(0));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();