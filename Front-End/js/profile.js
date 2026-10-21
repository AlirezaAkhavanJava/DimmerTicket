(() => {
    const $ = (id) => document.getElementById(id);
    const SECTIONS = ['overview', 'settings', 'comments', 'tickets', 'friends', 'gifts', 'wallet', 'levels'];

    const avatarGrid = $('avatar-grid');
    if (!avatarGrid || !window.AvatarArt || !window.AccountData || !window.AccountSections) return;

    let me = null;
    let noticeTimer = null;

    function say(text, type) {
        const el = $('profile-notice');
        el.textContent = text;                       // textContent, never innerHTML
        el.className = `notice ${type}`;
        el.hidden = false;
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => { el.hidden = true; }, 4000);
    }

    // Every call returns { ok, status, data }, so callers don't repeat the parsing.
    async function api(path, options) {
        try {
            const res = await DimmerApi.request(path, options);
            const text = await res.text();
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
            return { ok: res.ok, status: res.status, data };
        } catch (err) {
            return { ok: false, status: 0, data: { message: err.message } };
        }
    }

    function setUser(next) {
        me = next;
        window.dispatchEvent(new CustomEvent('dt:user-changed', { detail: me }));
    }

    const currentAvatar = () => (me && me.avatar) || AvatarArt.DEFAULT;

    // ---------- Navigation ----------
    function show(name) {
        const key = SECTIONS.includes(name) ? name : 'overview';
        document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== key; });
        document.querySelectorAll('.acct-nav [data-go]').forEach((b) => {
            b.classList.toggle('on', b.dataset.go === key);
        });
        window.scrollTo({ top: 0 });
    }

    document.addEventListener('click', (e) => {
        const go = e.target.closest('[data-go]');
        if (go) location.hash = go.dataset.go;
    });
    window.addEventListener('hashchange', () => show(location.hash.slice(1)));


    // Goes back to the main
    // Always return to the movies page.
    $('back-btn').addEventListener('click', () => {
        location.href = '/movies';
    });

    // ---------- Profile header and settings ----------
    function renderHero() {
        AvatarArt.render($('profile-avatar'), currentAvatar());
        $('profile-name').textContent = me.fullName;
        $('profile-username').textContent = `@${me.username}`;
        $('profile-role').textContent = me.role === 'ADMIN' ? 'Administrator' : 'Member';
    }

    function renderAvatarGrid() {
        const key = currentAvatar();
        avatarGrid.innerHTML = AvatarArt.keys.map((k) => `
      <button type="button" class="avatar-choice${k === key ? ' on' : ''}" data-avatar="${k}"
              aria-pressed="${k === key}" aria-label="${AvatarArt.label(k)} avatar"></button>`).join('');
        avatarGrid.querySelectorAll('[data-avatar]').forEach((b) => AvatarArt.render(b, b.dataset.avatar));
    }

    function renderDetails() {
        const f = $('profile-form').elements;
        f.namedItem('fullName').value = me.fullName ?? '';
        f.namedItem('birthDate').value = me.birthDate ?? '';
        f.namedItem('email').value = me.email ?? '';
    }

    function renderAll() {
        renderHero();
        renderAvatarGrid();
        renderDetails();
        AccountSections.renderAll(me);
    }

    avatarGrid.addEventListener('click', async (e) => {
        const choice = e.target.closest('[data-avatar]');
        if (!choice || choice.dataset.avatar === currentAvatar()) return;

        avatarGrid.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        const { ok, data } = await api('/account/avatar', {
            method: 'PUT',
            body: { avatar: choice.dataset.avatar },
        });
        avatarGrid.querySelectorAll('button').forEach((b) => { b.disabled = false; });

        if (!ok) return say(data.message || 'Could not save your avatar.', 'error');
        setUser(data);
        renderHero();
        renderAvatarGrid();
        say('Avatar updated.', 'success');
    });

    $('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.currentTarget.elements;
        const body = {
            fullName: f.namedItem('fullName').value.trim(),
            birthDate: f.namedItem('birthDate').value,
            email: me.email,                           // email changes come later, with a re-login
        };
        if (!body.fullName) return say('Full name is required.', 'error');
        if (!body.birthDate) return say('Date of birth is required.', 'error');

        const { ok, data } = await api('/account', { method: 'PUT', body });
        if (!ok) return say(data.message || 'Could not save your details.', 'error');

        setUser(data);
        renderAll();
        say('Details saved.', 'success');
    });

    $('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.currentTarget.elements;
        const currentPassword = f.namedItem('currentPassword').value;
        const newPassword = f.namedItem('newPassword').value;
        const confirm = f.namedItem('confirmPassword').value;

        if (newPassword.length < 8 || newPassword.length > 72) {
            return say('The new password must be 8 to 72 characters.', 'error');
        }
        if (newPassword !== confirm) return say('The new passwords do not match.', 'error');

        const { ok, data } = await api('/account/password', {
            method: 'POST',
            body: { currentPassword, newPassword },
        });
        if (!ok) return say(data.message || 'Could not change your password.', 'error');

        e.currentTarget.reset();
        say('Password changed.', 'success');
    });

    // ---------- Movie titles for the comment form ----------
    async function loadMovies() {
        try {
            const res = await DimmerApi.request('/movies');
            if (!res.ok) return;
            const list = await res.json();
            AccountSections.setMovies(list.map((m) => m.title));
        } catch {
            // The dropdown stays empty; the rest of the page still works.
        }
    }

    // ---------- Boot ----------
    AccountSections.init({ say });

    async function load() {
        const { ok, status, data } = await api('/account');
        if (status === 401) {
            location.href = '/login?next=account';
            return;
        }
        if (!ok) return say(data.message || 'Could not load your account.', 'error');

        setUser(data);
        renderAll();
        loadMovies();
    }

    show(location.hash.slice(1));
    load();
})();