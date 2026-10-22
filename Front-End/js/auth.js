(() => {
    const form = document.getElementById('auth-form');
    if (!form) return;

    const TERMS_VERSION = '1.0';
    const BLOCKED_TEXT = 'DimmerTick is not available in your country.';

    const mode = form.dataset.mode;                       // "login" or "register"
    const notice = document.getElementById('notice');
    const submitBtn = document.getElementById('submit-btn');
    const gate = document.getElementById('terms-gate');
    const termsBox = document.getElementById('terms-box');
    const termsHint = document.getElementById('terms-hint');
    const termsCheck = document.getElementById('terms-check');
    const geoLine = document.getElementById('terms-geo');
    const params = new URLSearchParams(location.search);

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const USERNAME_RE = /^[a-zA-Z0-9_]{3,100}$/;
    const SAFE_NEXT = /^[a-z0-9_-]+(\.html)?(\?[\w=&%.\-]*)?$/i;
    const REASON_TEXT = {
        watchlist: 'Log in to add movies to your watchlist.',
        booking: 'Log in to book tickets.',
        admin: 'Log in with an admin account to open the admin panel.',
    };

    let geo = null;               // { ip, country, blocked } from /api/geo/me
    let pendingTerms = false;     // logged in, but the current agreement is not accepted yet

    if (!window.DimmerApi) {
        showNotice('This page could not load its scripts. Reload the page and try again.', 'error');
        return;
    }

    if (mode === 'login') {
        if (params.has('registered')) {
            showNotice('Account created. You can log in now.', 'success');
        } else if (REASON_TEXT[params.get('reason')]) {
            showNotice(REASON_TEXT[params.get('reason')], 'error');
        }
    }
    if (mode === 'register') {
        gate.hidden = false;
        requestAnimationFrame(unlockIfAtEnd);
    }

    // ---------- helpers ----------

    async function readJson(res) {
        const text = await res.text();
        try { return text ? JSON.parse(text) : {}; } catch { return {}; }
    }

    function showNotice(text, type) {
        notice.textContent = text;          // textContent, never innerHTML
        notice.className = `notice ${type}`;
        notice.hidden = false;
    }

    function safeNext(value) {
        if (!value || !SAFE_NEXT.test(value)) return null;
        if (/^(login|register)(\.html)?(\?|$)/i.test(value)) return null;
        return value;
    }

    function goNext(role) {
        const next = safeNext(params.get('next'));
        location.href = next || (role === 'ADMIN' ? '/admin' : '/movies');
    }

    function canSubmit() {
        if (geo && geo.blocked) return false;
        if (mode === 'register' || pendingTerms) return termsCheck.checked;
        return true;
    }

    function buttonLabel() {
        if (pendingTerms) return 'Accept and continue';
        return mode === 'login' ? 'Log in' : 'Create account';
    }

    function setBusy(busy) {
        submitBtn.disabled = busy || !canSubmit();
        submitBtn.textContent = busy ? 'Please wait...' : buttonLabel();
    }

    // ---------- agreement box ----------

    // The checkbox unlocks only once the reader reaches the end of the agreement.
    function unlockIfAtEnd() {
        const atEnd = termsBox.scrollTop + termsBox.clientHeight >= termsBox.scrollHeight - 8;
        const fitsOnScreen = termsBox.scrollHeight <= termsBox.clientHeight + 4;
        if (atEnd || fitsOnScreen) {
            termsCheck.disabled = false;
            termsHint.hidden = true;
        }
    }
    termsBox.addEventListener('scroll', unlockIfAtEnd);

    // Ticking the box records the IP and country the server sees, so the reader can see them.
    async function recordLocation() {
        try {
            geo = await readJson(await DimmerApi.request('/geo/me'));
        } catch {
            termsCheck.checked = false;
            geoLine.textContent = 'Could not check your location. Check the connection and try again.';
            geoLine.hidden = false;
            return;
        }

        if (geo.blocked) {
            termsCheck.checked = false;
            termsCheck.disabled = true;
            geoLine.hidden = true;
            showNotice(BLOCKED_TEXT, 'error');
            return;
        }

        geoLine.textContent = `This acceptance will be recorded with IP ${geo.ip} (country: ${geo.country}).`;
        geoLine.hidden = false;
    }

    termsCheck.addEventListener('change', async () => {
        if (termsCheck.checked) {
            await recordLocation();
        } else {
            geoLine.hidden = true;
        }
        setBusy(false);
    });

    function enterTermsStep() {
        pendingTerms = true;
        gate.hidden = false;
        showNotice('Please read and accept the updated Terms of Purchase and Use to continue.', 'error');
        gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
        requestAnimationFrame(unlockIfAtEnd);
    }

    // ---------- validation ----------

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

    // ---------- submit ----------

    async function acceptPendingTerms() {
        if (!termsCheck.checked) return showNotice('Tick the box to accept the terms.', 'error');

        setBusy(true);
        try {
            const res = await DimmerApi.request('/account/terms', {
                method: 'POST',
                body: { version: TERMS_VERSION },
            });
            const data = await readJson(res);
            if (!res.ok) return showNotice(data.message || 'Could not save your acceptance.', 'error');

            pendingTerms = false;
            goNext(data.role);
        } catch (err) {
            showNotice(err.message || 'Something went wrong. Please try again.', 'error');
        } finally {
            setBusy(false);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        notice.hidden = true;

        if (pendingTerms) return acceptPendingTerms();

        const values = readValues();
        const errors = validate(values);
        showErrors(errors);
        if (Object.keys(errors).length) return;

        if (mode === 'register' && !termsCheck.checked) {
            return showNotice('Read the Terms of Purchase and Use and tick the box to continue.', 'error');
        }

        const body = mode === 'login'
            ? { email: values.email, password: values.password }
            : {
                fullName: values.fullName,
                birthDate: values.birthDate,
                username: values.username,
                email: values.email,
                password: values.password,
                termsVersion: TERMS_VERSION,
                termsAccepted: true,
            };

        setBusy(true);
        try {
            const res = await DimmerApi.request(`/auth/${mode}`, { method: 'POST', body });
            const data = await readJson(res);

            if (!res.ok) {
                showNotice(data.message || `Something went wrong (error ${res.status}). Please try again.`, 'error');
                return;
            }

            if (mode === 'register') {
                location.href = '/login?registered=1';
                return;
            }

            // Logged in, but the agreement is out of date or was never accepted.
            if (!data.termsAccepted) {
                enterTermsStep();
                return;
            }

            goNext(data.role);
        } catch (err) {
            console.error('[DimmerTick] request failed:', err);
            showNotice(err.message || 'Something went wrong. Please try again.', 'error');
        } finally {
            setBusy(false);
        }
    });

    // ---------- start ----------

    async function loadGeo() {
        try {
            geo = await readJson(await DimmerApi.request('/geo/me'));
        } catch {
            geo = null;
        }
        if (geo && geo.blocked) {
            showNotice(BLOCKED_TEXT, 'error');
            form.querySelectorAll('input, button').forEach((el) => { el.disabled = true; });
            return;
        }
        setBusy(false);
    }

    loadGeo();
})();