(() => {
  const btn = document.getElementById('account-btn');
  const menu = document.getElementById('account-menu');
  const label = document.getElementById('account-label');
  const avatar = document.getElementById('account-avatar');
  if (!btn || !menu) return;

  let user = null;

  function showAvatar(key) {
    if (window.AvatarArt) {
      AvatarArt.render(avatar, key);
    } else {
      avatar.textContent = 'A';
    }
  }

  function render() {
    if (user) {
      const name = user.fullName || user.username;
      label.textContent = name;
      showAvatar(user.avatar || (window.AvatarArt ? AvatarArt.DEFAULT : null));
      menu.innerHTML = `
        <p class="menu-hint">Signed in as <strong></strong></p>
        <a class="menu-item" href="/account">My account</a>
        ${user.role === 'ADMIN' ? '<a class="menu-item" href="/admin">Admin panel</a>' : ''}
        <button class="menu-item" type="button" data-action="logout">Log out</button>`;
      menu.querySelector('strong').textContent = user.username;
    } else {
      label.textContent = 'Account';
      avatar.textContent = 'A';
      menu.innerHTML = `
        <a class="menu-item" href="/login">Log in</a>
        <a class="menu-item" href="/register">Create account</a>`;
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
      // Reload so the page drops everything it loaded for this account.
      location.reload();
    }
  });

  // The profile page dispatches this after the avatar or name changes.
  window.addEventListener('dt:user-changed', (e) => {
    user = e.detail;
    render();
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