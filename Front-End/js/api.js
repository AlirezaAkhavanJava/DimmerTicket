// Shared helper for talking to the Spring Boot API.
// The pages and the API are served from the same origin (localhost:8080).
window.DimmerApi = (() => {
    const BASE = '/api';
    const SITE_PORT = '8080';

    // Why a signed-out visitor needs an account. Shown in the login popup.
    const REASONS = {
        watchlist: 'Log in to add movies to your watchlist.',
        booking: 'Log in to book tickets.',
        admin: 'Log in with an admin account to open the admin panel.',
    };

    function checkSite() {
        const port = location.port || '80';
        if (port !== SITE_PORT) {
            throw new Error(`Open the site at http://localhost:${SITE_PORT}. This page is on port ${port}.`);
        }
    }

    async function fetchCsrfToken() {
        let res;
        try {
            res = await fetch(`${BASE}/auth/csrf`, { credentials: 'include' });
        } catch {
            throw new Error(`Cannot reach the server. Check that the backend is running on http://localhost:${SITE_PORT}.`);
        }
        if (!res.ok) throw new Error(`Could not get a security token (HTTP ${res.status}).`);
        const data = await res.json();
        return data.token;
    }

    async function request(path, { method = 'GET', body } = {}) {
        checkSite();
        const isChange = method !== 'GET';
        const headers = { Accept: 'application/json' };
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        if (isChange) headers['X-XSRF-TOKEN'] = await fetchCsrfToken();

        try {
            return await fetch(`${BASE}${path}`, {
                method,
                credentials: 'include',
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
            });
        } catch {
            throw new Error(`Cannot reach the server. Check that the backend is running on http://localhost:${SITE_PORT}.`);
        }
    }

    // ---------------------------------------------------------------------
    // Popup panel in the top-right corner
    // ---------------------------------------------------------------------
    let popupTimer = null;

    function dismissPopup() {
        clearTimeout(popupTimer);
        const box = document.getElementById('login-prompt');
        if (!box) return;
        box.classList.remove('show');
        box.classList.add('leaving');
        setTimeout(() => box.remove(), 350);
    }

    function showPopup({ title, message, login = false, next = null, reason = null }) {
        document.getElementById('login-prompt')?.remove();
        clearTimeout(popupTimer);

        const box = document.createElement('div');
        box.id = 'login-prompt';
        box.className = 'login-prompt';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-labelledby', 'lp-title');

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'lp-close';
        close.setAttribute('aria-label', 'Close');
        close.textContent = '×';
        close.addEventListener('click', dismissPopup);

        const icon = document.createElement('div');
        icon.className = 'lp-icon';
        icon.textContent = login ? '!' : 'i';

        const heading = document.createElement('h3');
        heading.id = 'lp-title';
        heading.className = 'lp-title';
        heading.textContent = title;

        const text = document.createElement('p');
        text.className = 'lp-msg';
        text.textContent = message;          // textContent: no HTML injection

        box.append(close, icon, heading, text);

        if (login) {
            const params = new URLSearchParams({ next });
            if (reason) params.set('reason', reason);

            const actions = document.createElement('div');
            actions.className = 'lp-actions';

            const primary = document.createElement('a');
            primary.className = 'lp-primary';
            primary.href = `/login?${params}`;
            primary.textContent = 'Log in';

            const ghost = document.createElement('a');
            ghost.className = 'lp-ghost';
            ghost.href = '/register';
            ghost.textContent = 'Create account';

            actions.append(primary, ghost);
            box.append(actions);
        }

        document.body.append(box);
        // Two frames: the browser must draw the hidden state first, so the slide-in animates.
        requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('show')));
        popupTimer = setTimeout(dismissPopup, login ? 20000 : 6000);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') dismissPopup();
    });

    // ---------------------------------------------------------------------
    // Guard for actions that need an account
    // ---------------------------------------------------------------------
    /**
     * Returns the signed-in user. If nobody is signed in, shows the login popup and returns null.
     * The page stays where it is, so the visitor keeps their place.
     */
    async function requireLogin(reason) {
        let res;
        try {
            res = await request('/auth/me');
        } catch (err) {
            showPopup({ title: 'Connection problem', message: err.message });
            return null;
        }

        if (res.ok) return res.json();

        const next = (location.pathname.replace(/^\/+/, '') || 'index.html') + location.search;
        showPopup({
            title: 'Log in to continue',
            message: REASONS[reason] || 'Log in to continue.',
            login: true,
            next,
            reason,
        });
        return null;
    }

    return { BASE, request, requireLogin, showPopup, dismissPopup };
})();