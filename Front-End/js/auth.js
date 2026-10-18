(() => {
  const API = 'http://localhost:8080/api/auth';
  const form = document.getElementById('auth-form');
  if (!form) return;

  const mode = form.dataset.mode;                       // "login" or "register"
  const notice = document.getElementById('notice');
  const submitBtn = document.getElementById('submit-btn');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const USERNAME_RE = /^[a-zA-Z0-9_]{3,100}$/;
  const FALLBACK = {
    401: 'Wrong email or password.',
    409: 'That email or username is already in use.',
  };

  // After registering, the login page shows a success message.
  if (mode === 'login' && new URLSearchParams(location.search).has('registered')) {
    showNotice('Account created. You can log in now.', 'success');
  }

  // Trim normal text fields. Passwords are kept exactly as typed.
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
      if (!v.firstName) errors.firstName = 'First name is required.';
      if (!v.lastName) errors.lastName = 'Last name is required.';
      if (!USERNAME_RE.test(v.username)) errors.username = '3 to 100 letters, digits or underscores.';
    }

    if (!EMAIL_RE.test(v.email)) errors.email = 'Enter a valid email address.';

    if (mode === 'login') {
      if (!v.password) errors.password = 'Enter your password.';
    } else {
      if (v.password.length < 8) errors.password = 'Use at least 8 characters.';
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

  // Clear a field's error as soon as the user edits it.
  form.addEventListener('input', (e) => {
    const input = e.target;
    input.classList.remove('invalid');
    const slot = form.querySelector(`[data-for="${input.name}"]`);
    if (slot) slot.textContent = '';
  });

  function showNotice(text, type) {
    notice.textContent = text;       // textContent, never innerHTML, so no HTML injection
    notice.className = `notice ${type}`;
    notice.hidden = false;
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.textContent = busy
      ? 'Please wait...'
      : (mode === 'login' ? 'Log in' : 'Create account');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    notice.hidden = true;

    const values = readValues();
    const errors = validate(values);
    showErrors(errors);
    if (Object.keys(errors).length) return;

    const payload = mode === 'login'
      ? { email: values.email, password: values.password }
      : {
          firstName: values.firstName,
          lastName: values.lastName,
          username: values.username,
          email: values.email,
          password: values.password,
        };

    setBusy(true);
    try {
      const res = await fetch(`${API}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        showNotice(body.message || FALLBACK[res.status] || 'Something went wrong. Please try again.', 'error');
        return;
      }

      if (mode === 'login') {
        localStorage.setItem('dt-user', JSON.stringify(body.user));
        location.href = 'index.html';
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