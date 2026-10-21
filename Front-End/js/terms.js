(() => {
    const CURRENT = '1.0';
    const box = document.getElementById('accept-box');
    const btn = document.getElementById('accept-btn');
    const notice = document.getElementById('terms-notice');
    const next = new URLSearchParams(location.search).get('next');

    function say(text, type) {
        notice.textContent = text;              // textContent, never innerHTML
        notice.className = `notice ${type}`;
        notice.hidden = false;
    }

    // The checkbox unlocks only once the reader reaches the end of the agreement.
    function atBottom() {
        return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 16;
    }
    function unlockIfRead() {
        if (atBottom()) {
            box.disabled = false;
            window.removeEventListener('scroll', unlockIfRead);
        }
    }
    window.addEventListener('scroll', unlockIfRead);
    unlockIfRead();

    box.addEventListener('change', () => { btn.disabled = !box.checked; });

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
            const res = await DimmerApi.request('/account/terms', {
                method: 'POST',
                body: { version: CURRENT },
            });
            const text = await res.text();
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch { /* not JSON */ }

            if (res.status === 401) {
                location.href = '/login?next=terms';          // log in first, then come back here
                return;
            }
            if (!res.ok) {
                say(data.message || 'Could not save your acceptance. Please try again.', 'error');
                btn.disabled = false;
                return;
            }
            location.href = next ? `/${next}` : '/movies';
        } catch (err) {
            say(err.message || 'Something went wrong. Please try again.', 'error');
            btn.disabled = false;
        }
    });
})();