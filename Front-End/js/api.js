// Shared helper for talking to the Spring Boot API.
window.DimmerApi = (() => {
    const BASE = 'http://localhost:8080/api';

    function csrfToken() {
        const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }

    async function request(path, { method = 'GET', body } = {}) {
        const isChange = method !== 'GET';

        // Change requests need the CSRF cookie. Fetch it once if it's missing.
        if (isChange && !csrfToken()) {
            await fetch(`${BASE}/auth/csrf`, { credentials: 'include' });
        }

        const headers = {};
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        if (isChange && csrfToken()) headers['X-XSRF-TOKEN'] = csrfToken();

        return fetch(`${BASE}${path}`, {
            method,
            credentials: 'include',           // send the session cookie
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    }

    async function requireLogin() {
        const res = await request('/auth/me');
        if (res.ok) return res.json();

        const page = location.pathname.split('/').pop() || 'index.html';
        const next = encodeURIComponent(page + location.search);
        location.href = `login.html?next=${next}`;
        return null;
    }

    return { BASE, request, requireLogin };
})();