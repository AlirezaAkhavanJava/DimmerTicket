(() => {
  const btn = document.getElementById('account-btn');
  const menu = document.getElementById('account-menu');
  const label = document.getElementById('account-label');
  const avatar = document.getElementById('account-avatar');
  if (!btn || !menu) return;

  let user = null;

  function render() {
    if (user) {
      const name = user.fullName || user.username;
      label.textContent = name;
      avatar.textContent = name.charAt(0).toUpperCase();
      menu.innerHTML = `
        <p class="menu-hint">Signed in as <strong></strong></p>
        ${user.role === 'ADMIN' ? '<a class="menu-item" href="admin.html">Admin panel</a>' : ''}
        <button class="menu-item" type="button" data-action="logout">Log out</button>`;
      menu.querySelector('strong').textContent = user.username;
    } else {
      label.textContent = 'Account';
      avatar.textContent = 'A';
      menu.innerHTML = `
        <a class="menu-item" href="login.html">Log in</a>
        <a class="menu-item" href="register.html">Create account</a>`;
    }
  }

  async function loadUser() {
    try {
      const res = await DimmerApi.request('/auth/me');
      user = res.ok ? await res.json() : null;
    } catch {
      user = null;
    }
    render();
  }

  function setOpen(open) {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(menu.hidden);
  });

  menu.addEventListener('click', async (e) => {
    if (e.target.closest('[data-action="logout"]')) {
      await DimmerApi.request('/auth/logout', { method: 'POST' }).catch(() => {});
      user = null;
      render();
      setOpen(false);
    }
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  setOpen(false);
  loadUser();
})();