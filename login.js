(() => {
  const form = document.querySelector('.login-form');
  const identifierInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const status = document.getElementById('loginStatus');

  if (!form || !identifierInput || !passwordInput) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    status.className = 'login-status';

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;

    if (!identifier || !password) {
      status.textContent = 'Enter your email or username and password.';
      status.classList.add('visible', 'error');
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Signing in…';

    try {
      const credentials = identifier.includes('@')
        ? { email: identifier, password }
        : { username: identifier, password };
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || 'Sign in failed. Please try again.');
      }

      if (result.token) {
        localStorage.setItem('obi_snack_auth_token', result.token);
      }

      status.textContent = 'Signed in successfully.';
      status.classList.add('visible', 'success');
    } catch (error) {
      status.textContent = error.message;
      status.classList.add('visible', 'error');
    } finally {
      button.disabled = false;
      button.innerHTML = 'Sign in <span class="arrow" aria-hidden="true">→</span>';
    }
  });
})();