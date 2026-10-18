document.addEventListener('DOMContentLoaded', () => {
  const $ = (s) => document.querySelector(s);
  const FALLBACK = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop';

  // ---------- STATE ----------
  const state = {
    movies: [], view: 'home', genre: '', query: '', slide: 0, timer: null,
    list: JSON.parse(localStorage.getItem('cv-list') || '[]')
  };

  // ---------- HELPERS ----------
  const embedUrl = (url = '') => {
    if (url.includes('/embed/')) return url;
    const m = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : url;
  };
  const img = (src, alt, cls) =>
    `<img class="${cls}" src="${src}" alt="${alt}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK}'">`;
  const genresOf = (m) => m.genre.split(',').map((g) => g.trim());

  const visible = () => state.movies.filter((m) => {
    const q = state.query.toLowerCase();
    return (!q || m.title.toLowerCase().includes(q) || m.director.toLowerCase().includes(q))
      && (!state.genre || genresOf(m).includes(state.genre))
      && (state.view !== 'mylist' || state.list.includes(m.id));
  });

  // ---------- RENDER ----------
  function renderHero() {
    const m = state.movies[state.slide];
    if (!m) return;
    $('#hero').style.setProperty('--bg-img', `url("${m.backdrop || m.poster}")`);
    $('#hero-title').textContent = m.title;
    $('#hero-text').textContent = m.synopsis;
    $('#hero-meta').textContent = [m.year, ...genresOf(m), m.duration].join('  •  ');
    $('#hero-list').textContent = state.list.includes(m.id) ? '✓ In My List' : '＋ My List';
    $('#dots').innerHTML = state.movies.map((_, i) => `<i class="${i === state.slide ? 'on' : ''}"></i>`).join('');
  }

  function renderGrid() {
    const items = visible();
    $('#grid-title').textContent =
      state.view === 'mylist' ? 'My List' : state.genre || 'Trending Now';
    $('#grid').innerHTML = items.length
      ? items.map((m) => `
        <article class="card" data-id="${m.id}">
          ${img(m.poster, m.title, 'poster')}
          <h3>${m.title}</h3>
          <p><span class="star">★</span> ${m.rating}<span class="year">${m.year}</span></p>
        </article>`).join('')
      : `<p class="empty">${state.view === 'mylist' ? 'Your list is empty. Add a movie from the featured banner.' : 'No movies match your search.'}</p>`;
  }

  function renderGenres() {
    const all = [...new Set(state.movies.flatMap(genresOf))];
    $('#genres').innerHTML = all.map((g, i) =>
      `<button class="genre g${i % 6}${state.genre === g ? ' on' : ''}" data-genre="${g}">${g}</button>`).join('');
  }

  function renderTop() {
    const top = [...state.movies].sort((a, b) => b.rating - a.rating).slice(0, 5);
    $('#top-list').innerHTML = top.map((m, i) => `
      <div class="top-item" data-id="${m.id}">
        <span class="rank">${i + 1}</span>
        ${img(m.poster, m.title, '')}
        <div><h4>${m.title}</h4><p>${m.year}</p><p><span class="star">★</span> ${m.rating}</p></div>
      </div>`).join('');
  }

  // ---------- HERO SLIDER ----------
  function goTo(n) {
    state.slide = (n + state.movies.length) % state.movies.length;
    renderHero();
    clearInterval(state.timer);
    state.timer = setInterval(() => goTo(state.slide + 1), 7000);
  }

  // ---------- VIEWS ----------
  function setView(view) {
    closeDetails();
    state.view = view;
    document.querySelectorAll('#side-nav a').forEach((a) => a.classList.toggle('active', a.dataset.view === view));
    $('#hero').hidden = view !== 'home';
    $('#genres-section').hidden = view === 'mylist';
    renderGrid();
    if (view === 'genres') $('#genres-section').scrollIntoView({ behavior: 'smooth' });
  }

  function openDetails(id) {
    const m = state.movies.find((x) => x.id === id);
    if (!m) return;
    $('#d-title').textContent = m.title;
    $('#d-director').textContent = `Director: ${m.director}`;
    $('#d-rating').textContent = `★ ${m.rating}`;
    $('#d-duration').textContent = m.duration;
    $('#d-genre').textContent = m.genre;
    $('#d-synopsis').textContent = m.synopsis;
    $('#d-poster').src = m.poster;
    $('#d-poster').onerror = function () { this.src = FALLBACK; };
    $('#d-trailer').src = embedUrl(m.trailer);

    // The next 3 days, generated so they are never out of date
    $('#dates').innerHTML = [0, 1, 2].map((i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return `<button class="date${i ? '' : ' on'}">${d.toLocaleDateString('en-US', { weekday: 'long' })}
        <span>${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></button>`;
    }).join('');

    $('#home').hidden = true;
    $('#details').hidden = false;
    window.scrollTo(0, 0);
  }

  function closeDetails() {
    if ($('#details').hidden) return;
    $('#d-trailer').src = '';           // stops the video
    $('#details').hidden = true;
    $('#home').hidden = false;
  }

  function toggleList(id) {
    const i = state.list.indexOf(id);
    i > -1 ? state.list.splice(i, 1) : state.list.push(id);
    localStorage.setItem('cv-list', JSON.stringify(state.list));
    renderHero();
    renderGrid();
  }

  // ---------- EVENTS ----------
  $('#grid').addEventListener('click', (e) => {
    const c = e.target.closest('.card'); if (c) openDetails(+c.dataset.id);
  });
  $('#top-list').addEventListener('click', (e) => {
    const c = e.target.closest('.top-item'); if (c) openDetails(+c.dataset.id);
  });
  $('#genres').addEventListener('click', (e) => {
    const b = e.target.closest('.genre'); if (!b) return;
    state.genre = state.genre === b.dataset.genre ? '' : b.dataset.genre;
    renderGenres(); renderGrid();
  });
  $('#clear-genre').addEventListener('click', () => { state.genre = ''; renderGenres(); renderGrid(); });
  $('#side-nav').addEventListener('click', (e) => {
    const a = e.target.closest('a'); if (!a) return;
    e.preventDefault(); setView(a.dataset.view);
  });
  $('#search').addEventListener('input', (e) => {
    state.query = e.target.value.trim();
    closeDetails(); renderGrid();
  });
  $('#prev').addEventListener('click', () => goTo(state.slide - 1));
  $('#next').addEventListener('click', () => goTo(state.slide + 1));
  $('#hero-watch').addEventListener('click', () => openDetails(state.movies[state.slide].id));
  $('#hero-list').addEventListener('click', () => toggleList(state.movies[state.slide].id));
  $('#explore').addEventListener('click', () => {
    openDetails(state.movies[Math.floor(Math.random() * state.movies.length)].id);
  });
  $('#back-btn').addEventListener('click', closeDetails);
  $('#dates').addEventListener('click', (e) => {
    const b = e.target.closest('.date'); if (!b) return;
    document.querySelectorAll('.date').forEach((d) => d.classList.remove('on'));
    b.classList.add('on');
  });

  // ---------- INIT ----------
  (async function init() {
    try {
      const res = await fetch('data/movies.json');
      if (!res.ok) throw new Error('Could not load data/movies.json');
      state.movies = await res.json();
      renderGrid(); renderGenres(); renderTop(); goTo(0);
    } catch (err) {
      console.error(err);
      $('#grid').innerHTML = '<p class="empty">Could not load movies. Run the project from a local server (see the guide).</p>';
    }
  })();
});