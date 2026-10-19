document.addEventListener('DOMContentLoaded', () => {
  const $ = (s) => document.querySelector(s);
  const IMG = 'https://image.tmdb.org/t/p/';          // official TMDB image CDN (small sizes = fast)
  const API = '/api/movies';      // Spring Boot backend
  const PRICE = 14, MAX_SEATS = 8;

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

  const state = { movies: [], view: 'home', genre: '', query: '', slide: 0, timer: null, cur: null, slot: null,
    seats: new Set(), shown: 12, gimg: {}, feat: [], list: JSON.parse(localStorage.getItem('dt-list') || '[]') };

  // ---------- helpers ----------
  const ic = (n, c = '') => `<svg class="i ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const poster = (m, size = 'w342', cls = '', lazy = true) =>
    `<div class="pw ${cls}" data-t="${m.title}"><img src="${IMG}${size}${m.poster}" alt="${m.title} poster" width="342" height="513" ${lazy ? 'loading="lazy"' : ''} decoding="async" onerror="this.remove()"></div>`;
  const genresOf = (m) => m.genre.split(',').map((g) => g.trim());
  const ageChip = (m) => `<span class="age a-${m.age.replace('-', '')}" title="Age rating">${m.age}</span>`;
  const rates = (m) => `<span class="rate"><b>IMDb</b>${m.imdb}</span><span class="rate" title="Rotten Tomatoes">${ic('tomato')}${m.rottenTomatoes}%</span>`;
  const fmtDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const sold = (m) => 35 + (m.id * 29) % 60;           // demo numbers: replace with real booking data
  const lastHour = (m) => 20 + (m.id * 53) % 180;
  let toastTimer;
  const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400); };

  const card = (m, i = 0) => `
    <article class="card" style="--i:${Math.min(i, 12)}" data-id="${m.id}" tabindex="0">
      ${poster(m)}${ageChip(m)}
      <h3>${m.title}</h3>
      <p><span>${ic('star', 'st')} ${m.imdb}</span><span class="rt-s">${ic('tomato')}${m.rottenTomatoes}%</span></p>
    </article>`;

  const visible = () => state.movies.filter((m) => {
    const q = state.query.toLowerCase();
    return (!q || [m.title, m.director, ...m.cast].some((x) => x.toLowerCase().includes(q)))
      && (!state.genre || genresOf(m).includes(state.genre))
      && (state.view !== 'mylist' || state.list.includes(m.id));
  });

  // ---------- home renderers ----------
  function renderHero() {
    const m = state.feat[state.slide], h = $('#hero');
    h.style.setProperty('--bg-img', `url("${IMG}w342${m.poster}")`);
    $('#hero-poster').innerHTML = poster(m, 'w500', '', false);
    $('#hero-title').textContent = m.title;
    $('#hero-chips').innerHTML = ageChip(m) + rates(m);
    $('#hero-text').textContent = m.synopsis;
    $('#hero-meta').textContent = `Directed by ${m.director}  |  ${fmtDate(m.releaseDate)}  |  ${m.duration}`;
    $('#hero-list').innerHTML = state.list.includes(m.id) ? `${ic('check')}In My List` : `${ic('plus')}My List`;
    $('#dots').innerHTML = state.feat.map((_, i) => `<i class="${i === state.slide ? 'on' : ''}"></i>`).join('');
    h.classList.remove('swap'); void h.offsetWidth; h.classList.add('swap');
  }
  function renderHot() {
    $('#hot').innerHTML = [...state.movies].sort((a, b) => sold(b) - sold(a)).slice(0, 6).map((m) => `
      <article class="hot" data-id="${m.id}">${poster(m, 'w154')}
        <div><h3>${m.title}</h3><p>${lastHour(m)} tickets in the last hour</p>
        <div class="bar"><i style="--w:${sold(m)}%"></i></div>
        <small>${sold(m)}% sold${sold(m) > 85 ? ' - almost full' : ''}</small></div></article>`).join('');
  }
  const isFiltering = () => !!(state.query || state.genre || state.view === 'mylist');
  function renderGrid() {
    const items = visible(), filtering = isFiltering();
    const list = filtering ? items : items.slice(0, state.shown);
    $('#grid-title').textContent = state.view === 'mylist' ? 'My List' : state.genre ? `${state.genre} (${items.length})` : 'Now showing';
    $('#grid').innerHTML = list.length ? list.map(card).join('')
      : `<p class="empty">${state.view === 'mylist' ? 'Your list is empty. Add a movie with the My List button.' : 'No movies match your search.'}</p>`;
    $('#more').hidden = filtering || state.shown >= items.length;
  }
  function renderGenres() {
    const count = {};
    state.movies.forEach((m) => genresOf(m).forEach((g) => count[g] = (count[g] || 0) + 1));
    $('#genres').innerHTML = Object.keys(count).sort((a, b) => count[b] - count[a]).map((g, i) => {
      const pool = state.movies.filter((m) => genresOf(m).includes(g));
      const m = state.gimg[g] || (state.gimg[g] = pool[Math.floor(Math.random() * pool.length)]);   // random, but stable
      return `<button class="genre g${i % 6}${state.genre === g ? ' on' : ''}" data-genre="${g}">
        <img src="${IMG}w185${m.poster}" alt="" loading="lazy" decoding="async" onerror="this.remove()">
        <span class="g-name">${g}<small>${count[g]} movie${count[g] > 1 ? 's' : ''}</small></span></button>`;
    }).join('');
  }
  function renderRows() {
    const count = {};
    state.movies.forEach((m) => genresOf(m).forEach((g) => count[g] = (count[g] || 0) + 1));
    $('#rows').innerHTML = Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 6).map((g) => `
      <section><div class="row-head"><h2>${g}</h2></div>
      <div class="rail-wrap">
        <button class="rail-btn l" data-dir="-1" aria-label="Scroll left" hidden>${ic('left')}</button>
        <div class="rail">${state.movies.filter((m) => genresOf(m).includes(g)).map((m, i) => card(m, i)).join('')}</div>
        <button class="rail-btn r" data-dir="1" aria-label="Scroll right">${ic('right')}</button>
      </div></section>`).join('');
  }
  const updateArrows = (rail) => {
    const w = rail.parentElement, max = rail.scrollWidth - rail.clientWidth;
    w.querySelector('.l').hidden = rail.scrollLeft < 8;
    w.querySelector('.r').hidden = rail.scrollLeft > max - 8;
  };
  const updateAllArrows = () => requestAnimationFrame(() => document.querySelectorAll('.rail').forEach(updateArrows));
  function renderTop() {
    $('#top-list').innerHTML = [...state.movies].sort((a, b) => b.imdb - a.imdb).slice(0, 5).map((m, i) => `
      <div class="top-item" data-id="${m.id}"><span class="rank">${i + 1}</span>${poster(m, 'w92')}
      <div><h4>${m.title}</h4><p>${m.releaseDate.slice(0, 4)}</p><p>${ic('star', 'st')} ${m.imdb}</p></div></div>`).join('');
  }
  function renderDeals() {
    $('#deals').innerHTML = DEALS.map((d) => `<div class="deal"><h4>${d.t}</h4><p>${d.d}</p>
      <button class="code" data-code="${d.c}">${ic('copy')}${d.c}</button></div>`).join('');
  }

  function refresh() {
    const filtering = isFiltering();
    $('#hero').hidden = !!filtering || state.view !== 'home';
    $('#hot-section').hidden = !!filtering;
    $('#rows').hidden = !!filtering;
    $('#genres-section').hidden = state.view === 'mylist';
    renderGrid(); updateAllArrows();
  }

  // ---------- slider ----------
  function goTo(n) {
    state.slide = (n + state.feat.length) % state.feat.length;
    renderHero();
    clearInterval(state.timer);
    state.timer = setInterval(() => goTo(state.slide + 1), 8000);
  }

  // ---------- details ----------
  function openDetails(id) {
    const m = state.movies.find((x) => x.id === id); if (!m) return;
    state.cur = m; state.slot = null; state.seats.clear();
    const days = [0, 1, 2].map((i) => { const d = new Date(); d.setDate(d.getDate() + i);
      return `<button class="date${i ? '' : ' on'}">${d.toLocaleDateString('en-US', { weekday: 'long' })}<span>${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></button>`; }).join('');
    $('#details').innerHTML = `
      <button class="back" id="back-btn">${ic('left')}Back to movies</button>
      <div class="d-hero">
        <div class="trailer">${m.trailer
          ? `<iframe src="${m.trailer}" title="${m.title} trailer" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>`
          : `<div class="no-trailer">${ic('film')}<p>Trailer not added yet.</p><a class="btn ghost" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(m.title + ' official trailer')}">Search on YouTube</a></div>`}</div>
        <div class="d-info">
          <div class="chips">${ageChip(m)}${rates(m)}</div>
          <h1>${m.title}</h1>
          <dl class="facts">
            <div><dt>Director</dt><dd>${m.director}</dd></div><div><dt>Release date</dt><dd>${fmtDate(m.releaseDate)}</dd></div>
            <div><dt>Runtime</dt><dd>${m.duration}</dd></div><div><dt>Genre</dt><dd>${m.genre}</dd></div>
          </dl>
          <p class="muted">${m.synopsis}</p>
          ${m.age === 'R' ? `<p class="warn">${ic('shield')}Not suitable for children. ID may be checked at the door.</p>` : ''}
        </div>
        ${poster(m, 'w500', 'd-poster', false)}
      </div>
      <h2>Cast</h2>
      <div class="cast">${m.cast.map((c) => { const p = c.split(' '); return `<div><span class="av">${p[0][0]}${p[p.length - 1][0]}</span>${c}</div>`; }).join('')}</div>
      <h2>${ic('trophy')}Awards</h2>
      <ul class="awards">${m.awards.map((a) => `<li>${ic('trophy')}${a}</li>`).join('')}</ul>
      <h2>Select date</h2><div class="dates" id="dates">${days}</div>
      <h2>Cinemas in New York</h2>
      ${CINEMAS.map((c, i) => `<details class="cinema"${i ? '' : ' open'}>
        <summary><div><strong>${c.n}</strong><small>${c.a}</small></div><span>Showtimes</span></summary>
        <div class="times">${c.t.map((t) => `<button data-cin="${c.n}" data-time="${t}">${t}</button>`).join('')}</div></details>`).join('')}
      <div id="seatbox" hidden></div>
      <h2>${ic('shield')}Cinema rules</h2>
      <ul class="rules">${RULES.map((r) => `<li>${ic(r[0])}${r[1]}</li>`).join('')}</ul>`;
    $('#home').hidden = true; $('#details').hidden = false; window.scrollTo(0, 0);
  }
  function closeDetails() {
    if ($('#details').hidden) return;
    $('#details').innerHTML = '';                       // also stops the trailer
    $('#details').hidden = true; $('#home').hidden = false;
  }

  // ---------- seats ----------
  function isTaken(r, c, seed) {                        // same showtime always gives the same map
    let x = seed ^ Math.imul(r + 1, 0x9E3779B1) ^ Math.imul(c + 1, 0x85EBCA6B);
    x = Math.imul(x ^ (x >>> 15), 0x2C1B3C6D);
    return ((x ^ (x >>> 12)) >>> 0) % 100 < 28;
  }
  function showSeats() {
    const { cin, time } = state.slot, seed = [...`${state.cur.id}${cin}${time}`].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
    state.seats.clear();
    const rows = 'ABCDEFGH'.split('').map((L, r) => `<div class="srow"><span>${L}</span>${
      Array.from({ length: 10 }, (_, c) => { const id = L + (c + 1), t = isTaken(r, c, seed);
        return `<button class="seat ${t ? 'taken' : 'free'}" data-seat="${id}" ${t ? 'disabled' : ''} aria-label="Seat ${id}${t ? ', taken' : ''}"></button>`; }).join('')}</div>`).join('');
    const box = $('#seatbox'); box.hidden = false;
    box.innerHTML = `<div class="seatbox">
      <h2>${ic('ticket')}Choose your seats</h2><p class="muted small" style="margin-bottom:20px">${state.cur.title} at ${cin}, ${time}</p>
      <div class="screen">SCREEN</div><div class="seats">${rows}</div>
      <div class="legend"><span><i class="seat free"></i>Available</span><span><i class="seat sel"></i>Selected</span><span><i class="seat taken"></i>Taken</span></div>
      <div class="sum"><div><span class="muted small">Seats</span><br><strong id="sum-seats">None yet</strong></div>
      <div><span class="muted small">Total</span><br><strong id="sum-total">$0</strong></div>
      <button class="btn grad" id="book" disabled>${ic('ticket')}Book tickets</button></div></div>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function updateSum() {
    const s = [...state.seats];
    $('#sum-seats').textContent = s.length ? s.join(', ') : 'None yet';
    $('#sum-total').textContent = `$${s.length * PRICE}`;
    $('#book').disabled = !s.length;
  }

  // ---------- views ----------
  function setView(v) {
    closeDetails(); state.view = v; state.genre = ''; renderGenres();
    document.querySelectorAll('#side-nav a').forEach((a) => a.classList.toggle('active', a.dataset.view === v));
    refresh();
    if (v === 'genres') $('#genres-section').scrollIntoView({ behavior: 'smooth' });
  }
  function toggleList(id) {
    const i = state.list.indexOf(id); i > -1 ? state.list.splice(i, 1) : state.list.push(id);
    localStorage.setItem('dt-list', JSON.stringify(state.list));
    renderHero(); renderGrid(); toast(i > -1 ? 'Removed from My List' : 'Added to My List');
  }

  // ---------- events ----------
  $('#home').addEventListener('click', (e) => {
    const rb = e.target.closest('.rail-btn');
    if (rb) { const r = rb.parentElement.querySelector('.rail'); r.scrollBy({ left: rb.dataset.dir * r.clientWidth * 0.85, behavior: 'smooth' }); return; }
    const t = e.target.closest('[data-id]'); if (t) return openDetails(+t.dataset.id);
    const g = e.target.closest('[data-genre]');
    if (g) { state.genre = state.genre === g.dataset.genre ? '' : g.dataset.genre; renderGenres(); refresh();
      if (state.genre) requestAnimationFrame(() => $('#grid-title').scrollIntoView({ behavior: 'smooth', block: 'start' }));   // jump to the results
      return; }
    const c = e.target.closest('[data-code]');
    if (c) { navigator.clipboard?.writeText(c.dataset.code); toast(`Code ${c.dataset.code} copied`); }
  });
  $('#home').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.closest('.card')?.click(); });
  $('#details').addEventListener('click', (e) => {
    if (e.target.closest('#back-btn')) return closeDetails();
    const d = e.target.closest('.date');
    if (d) { document.querySelectorAll('.date').forEach((x) => x.classList.remove('on')); d.classList.add('on'); if (state.slot) showSeats(); return; }
    const t = e.target.closest('[data-time]');
    if (t) { document.querySelectorAll('.times button').forEach((x) => x.classList.remove('on')); t.classList.add('on'); state.slot = { cin: t.dataset.cin, time: t.dataset.time }; return showSeats(); }
    const s = e.target.closest('.seat.free, .seat.sel');
    if (s && s.dataset.seat) {
      if (state.seats.has(s.dataset.seat)) { state.seats.delete(s.dataset.seat); s.classList.replace('sel', 'free'); }
      else if (state.seats.size >= MAX_SEATS) return toast(`You can book up to ${MAX_SEATS} seats`);
      else { state.seats.add(s.dataset.seat); s.classList.replace('free', 'sel'); }
      return updateSum();
    }
    if (e.target.closest('#book')) {
      const list = [...state.seats].join(', ');
      state.seats.forEach((id) => { const b = document.querySelector(`[data-seat="${id}"]`); b.className = 'seat taken'; b.disabled = true; });
      state.seats.clear(); updateSum(); toast(`Booked ${list}. Enjoy the movie! (demo)`);
    }
  });
  $('#side-nav').addEventListener('click', (e) => { const a = e.target.closest('a'); if (a) { e.preventDefault(); setView(a.dataset.view); } });
  $('#search').addEventListener('input', (e) => { state.query = e.target.value.trim(); closeDetails(); refresh(); });
  $('#clear-genre').addEventListener('click', () => { state.genre = ''; renderGenres(); refresh(); });
  $('#more').addEventListener('click', () => { state.shown += 12; renderGrid(); });
  $('#rows').addEventListener('scroll', (e) => { if (e.target.classList && e.target.classList.contains('rail')) updateArrows(e.target); }, true);
  window.addEventListener('resize', updateAllArrows);
  $('#prev').addEventListener('click', () => goTo(state.slide - 1));
  $('#next').addEventListener('click', () => goTo(state.slide + 1));
  $('#hero-watch').addEventListener('click', () => openDetails(state.feat[state.slide].id));
  $('#hero-list').addEventListener('click', () => toggleList(state.feat[state.slide].id));

  // ---------- init ----------
  (async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(`Could not load movies from ${API} (status ${res.status})`);
      state.movies = await res.json();
      state.feat = state.movies.slice(0, 6);
      renderHot(); renderGenres(); renderRows(); renderTop(); renderDeals(); refresh(); goTo(0);
    } catch (err) {
      console.error(err);
      $('#grid').innerHTML = '<p class="empty">Could not load movies. Check that the Spring Boot backend is running on port 8080.</p>';
    }
  })();
});