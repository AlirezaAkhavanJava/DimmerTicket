(() => {
    const form = document.getElementById('auth-form');
    if (!form) return;

    const mode = form.dataset.mode;                      // "login" or "register"
    const notice = document.getElementById('notice');
    const submitBtn = document.getElementById('submit-btn');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const USERNAME_RE = /^[a-zA-Z0-9_]{3,100}$/;

    // A plain page name on this site, such as "movies", "account.html" or "index.html?x=1".
    const SAFE_NEXT = /^[a-z0-9_-]+(\.html)?(\?[\w=&%.\-]*)?$/i;

    // Explanations for the reasons the site sends visitors here.
    const REASON_TEXT = {
        watchlist: 'Log in to add movies to your watchlist.',
        booking: 'Log in to book tickets.',
        admin: 'Log in with an admin account to open the admin panel.',
    };

    const params = new URLSearchParams(location.search);

    if (!window.DimmerApi) {
        showNotice('This page could not load its scripts. Reload the page and try again.', 'error');
        console.error('[DimmerTick] api.js is missing. Add <script src="js/api.js"></script> before auth.js.');
        return;
    }

    if (mode === 'login') {
        if (params.has('registered')) {
            showNotice('Account created. You can log in now.', 'success');
        } else if (REASON_TEXT[params.get('reason')]) {
            showNotice(REASON_TEXT[params.get('reason')], 'error');
        }
    }

    function safeNext(value) {
        if (!value || !SAFE_NEXT.test(value)) return null;
        // Never send people back to the forms or to the terms page as a destination.
        if (/^(login|register|terms)(\.html)?(\?|$)/i.test(value)) return null;
        return value;
    }

    function readValues() {
        const values = {};
        for (const [key, value] of new FormData(form)) {
            values[key] = (key === 'password' || key === 'confirmPassword') ? value : value.trim();
        }
        return values;
    }

    function validate(v) {
        const errors = {};

        if (mode === 'register') {
            if (!v.fullName) errors.fullName = 'Full name is required.';
            if (!v.birthDate) {
                errors.birthDate = 'Date of birth is required.';
            } else if (new Date(v.birthDate) > new Date()) {
                errors.birthDate = 'Date of birth cannot be in the future.';
            }
            if (!USERNAME_RE.test(v.username)) errors.username = '3 to 100 letters, digits or underscores.';
        }

        if (!EMAIL_RE.test(v.email)) errors.email = 'Enter a valid email address.';

        if (mode === 'login') {
            if (!v.password) errors.password = 'Enter your password.';
        } else {
            if (v.password.length < 8) errors.password = 'Use at least 8 characters.';
            else if (v.password.length > 72) errors.password = 'Use at most 72 characters.';
            if (v.confirmPassword !== v.password) errors.confirmPassword = 'Passwords do not match.';
        }

        return errors;
    }

    function showErrors(errors) {
        for (const input of form.querySelectorAll('input[name]')) {
            const msg = errors[input.name] || '';
            input.classList.toggle('invalid', !!msg);
            const slot = form.querySelector(`[data-for="${input.name}"]`);
            if (slot) slot.textContent = msg;
        }
    }

    form.addEventListener('input', (e) => {
        const input = e.target;
        input.classList.remove('invalid');
        const slot = form.querySelector(`[data-for="${input.name}"]`);
        if (slot) slot.textContent = '';
    });

    function showNotice(text, type) {
        notice.textContent = text;             // textContent, never innerHTML
        notice.className = `notice ${type}`;
        notice.hidden = false;
    }

    function setBusy(busy) {
        submitBtn.disabled = busy;
        submitBtn.textContent = busy ? 'Please wait...' : (mode === 'login' ? 'Log in' : 'Create account');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        notice.hidden = true;

        const values = readValues();
        const errors = validate(values);
        showErrors(errors);
        if (Object.keys(errors).length) return;

        const body = mode === 'login'
            ? { email: values.email, password: values.password }
            : {
                fullName: values.fullName,
                birthDate: values.birthDate,
                username: values.username,
                email: values.email,
                password: values.password,
            };

        setBusy(true);
        try {
            const res = await DimmerApi.request(`/auth/${mode}`, { method: 'POST', body });
            const text = await res.text();
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch { /* not JSON */ }

            if (!res.ok) {
                showNotice(data.message || `Something went wrong (error ${res.status}). Please try again.`, 'error');
                return;
            }

            if (mode === 'login') {
                const next = safeNext(params.get('next'));
                // Everyone must accept the current agreement before booking.
                if (!data.termsAccepted) {
                    location.href = '/terms' + (next ? `?next=${encodeURIComponent(next)}` : '');
                } else {
                    location.href = next || (data.role === 'ADMIN' ? '/admin' : '/movies');
                }
            } else {
                location.href = '/login?registered=1';
            }
        } catch (err) {
            console.error('[DimmerTick] request failed:', err);
            showNotice(err.message || 'Something went wrong. Please try again.', 'error');
        } finally {
            setBusy(false);
        }
    });
})();