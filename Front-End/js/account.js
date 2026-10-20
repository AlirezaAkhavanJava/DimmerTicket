(() => {
  const btn = document.getElementById('account-btn');
  const menu = document.getElementById('account-menu');
  const label = document.getElementById('account-label');
  const avatar = document.getElementById('account-avatar');
  if (!btn || !menu) return;

  function currentUser() {
    try {
      return JSON.parse(localStorage.getItem('dt-user'));
    } catch {
      return null;
    }
  }

  // Rebuild the button and menu to match whether someone is signed in.
  function render() {
    const user = currentUser();

    if (user) {
      const name = user.fullName || user.username;
      label.textContent = name;
      avatar.textContent = name.charAt(0).toUpperCase();
      menu.innerHTML = `
        <p class="menu-hint">Signed in as <strong></strong></p>
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

  function setOpen(open) {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();             // keeps the document listener below from closing it right away
    setOpen(menu.hidden);
  });

  menu.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="logout"]')) {
      localStorage.removeItem('dt-user');
      render();
      setOpen(false);
    }
  });

  // Click outside the menu, or press Escape, to close it.
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  setOpen(false);
  render();
})();