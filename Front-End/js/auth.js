(() => {
    const form = document.getElementById('auth-form');
    if (!form) return;

    const mode = form.dataset.mode;                      // "login" or "register"
    const notice = document.getElementById('notice');
    const submitBtn = document.getElementById('submit-btn');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const USERNAME_RE = /^[a-zA-Z0-9_]{3,100}$/;

    if (mode === 'login' && new URLSearchParams(location.search).has('registered')) {
        showNotice('Account created. You can log in now.', 'success');
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
            const data = await res.json().catch(() => ({}));

            if (res.status === 403) {
                showNotice('Your session expired. Reload the page and try again.', 'error');
                return;
            }
            if (!res.ok) {
                showNotice(data.message || 'Something went wrong. Please try again.', 'error');
                return;
            }

            // The server has already set the session cookie. The browser stores nothing about the user.
            if (mode === 'login') {
                location.href = data.role === 'ADMIN' ? 'admin.html' : 'index.html';
            } else {
                location.href = 'login.html?registered=1';
            }
        } catch {
            showNotice('Cannot reach the server. Is the backend running on port 8080?', 'error');
        } finally {
            setBusy(false);
        }
    });
})();