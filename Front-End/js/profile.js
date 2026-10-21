(() => {
    const $ = (id) => document.getElementById(id);
    const avatarGrid = $('avatar-grid');
    const bigAvatar = $('profile-avatar');
    const notice = $('profile-notice');
    const detailsForm = $('profile-form');
    const passwordForm = $('password-form');
    if (!avatarGrid || !window.AvatarArt) return;

    let me = null;
    let noticeTimer = null;

    function say(text, type) {
        notice.textContent = text;                 // textContent, never innerHTML
        notice.className = `notice ${type}`;
        notice.hidden = false;
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => { notice.hidden = true; }, 4000);
    }

    // Every request returns the same shape: { ok, status, data }.
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

    function renderAvatars() {
        AvatarArt.render(bigAvatar, currentAvatar());
        avatarGrid.innerHTML = AvatarArt.keys.map((key) => {
            const selected = key === currentAvatar();
            return `<button type="button" class="avatar-choice${selected ? ' on' : ''}"
                      data-avatar="${key}" aria-pressed="${selected}"
                      aria-label="${AvatarArt.label(key)} avatar"></button>`;
        }).join('');
        avatarGrid.querySelectorAll('[data-avatar]').forEach((btn) => {
            AvatarArt.render(btn, btn.dataset.avatar);
        });
    }

    function renderProfile() {
        $('profile-name').textContent = me.fullName;
        $('profile-username').textContent = `@${me.username}`;
        $('profile-role').textContent = me.role === 'ADMIN' ? 'Administrator' : 'Member';

        const f = detailsForm.elements;
        f.namedItem('fullName').value = me.fullName ?? '';
        f.namedItem('birthDate').value = me.birthDate ?? '';
        f.namedItem('email').value = me.email ?? '';

        renderAvatars();
    }

    async function load() {
        const { ok, status, data } = await api('/account');
        if (status === 401) {
            location.href = '/login?next=account.html';
            return;
        }
        if (!ok) {
            say(data.message || 'Could not load your account.', 'error');
            return;
        }
        setUser(data);
        renderProfile();
    }

    avatarGrid.addEventListener('click', async (e) => {
        const choice = e.target.closest('[data-avatar]');
        if (!choice || choice.dataset.avatar === currentAvatar()) return;

        avatarGrid.querySelectorAll('button').forEach((b) => (b.disabled = true));
        const { ok, data } = await api('/account/avatar', {
            method: 'PUT',
            body: { avatar: choice.dataset.avatar },
        });
        avatarGrid.querySelectorAll('button').forEach((b) => (b.disabled = false));

        if (!ok) {
            say(data.message || 'Could not save your avatar.', 'error');
            return;
        }
        setUser(data);
        renderAvatars();
        say('Avatar updated.', 'success');
    });

    detailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = detailsForm.elements;
        const body = {
            fullName: f.namedItem('fullName').value.trim(),
            birthDate: f.namedItem('birthDate').value,
            email: me.email,                          // email changes come later, with a re-login
        };
        if (!body.fullName) return say('Full name is required.', 'error');
        if (!body.birthDate) return say('Date of birth is required.', 'error');

        const { ok, data } = await api('/account', { method: 'PUT', body });
        if (!ok) return say(data.message || 'Could not save your details.', 'error');

        setUser(data);
        renderProfile();
        say('Details saved.', 'success');
    });

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = passwordForm.elements;
        const currentPassword = f.namedItem('currentPassword').value;
        const newPassword = f.namedItem('newPassword').value;
        const confirm = f.namedItem('confirmPassword').value;

        if (newPassword.length < 8 || newPassword.length > 72) {
            return say('The new password must be 8 to 72 characters.', 'error');
        }
        if (newPassword !== confirm) {
            return say('The new passwords do not match.', 'error');
        }

        const { ok, data } = await api('/account/password', {
            method: 'POST',
            body: { currentPassword, newPassword },
        });
        if (!ok) return say(data.message || 'Could not change your password.', 'error');

        passwordForm.reset();
        say('Password changed.', 'success');
    });

    load();
})();