// Shared helper for talking to the Spring Boot API.
// The API is served on the same origin as the pages, so the site must be opened at localhost:8080.
window.DimmerApi = (() => {
    const BASE = '/api';
    const SITE_PORT = '8080';

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

    async function requireLogin(reason) {
        const res = await request('/auth/me');
        if (res.ok) return res.json();

        const page = location.pathname.replace(/^\/+/, '') || 'index.html';
        const params = new URLSearchParams({ next: page + location.search });
        if (reason) params.set('reason', reason);
        location.href = `/login?${params}`;
        return null;
    }

    return { BASE, request, requireLogin };
})();