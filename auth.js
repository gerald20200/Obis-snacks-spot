(() => {
  const pinForm = document.getElementById('pinForm');
  const pinInput = document.getElementById('accessPin');
  const togglePin = document.getElementById('togglePin');
  const googleButton = document.getElementById('googleButton');
  const authStatus = document.getElementById('authStatus');
  const logoutButton = document.getElementById('logoutButton');
  const logoutButtonLabel = document.getElementById('logoutButtonLabel');

  const setStatus = (message, type = 'error') => {
    if (!authStatus) return;
    authStatus.textContent = message;
    authStatus.className = `status-message visible ${type}`;
  };

  const clearStatus = () => {
    if (authStatus) {
      authStatus.textContent = '';
      authStatus.className = 'status-message';
    }
  };

  const setBusy = (button, isBusy, label) => {
    if (!button) return;
    button.disabled = isBusy;
    if (label) button.dataset.originalLabel = button.dataset.originalLabel || button.textContent;
    if (label) button.textContent = isBusy ? label : button.dataset.originalLabel;
  };

  const api = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong. Please try again.');
    }
    return data;
  };

  const redirectAfterAuth = (returnTo) => {
    const safePath = returnTo === '/index.html' || returnTo === '/thankyou.html' || returnTo === '/customer-account.html'
      ? returnTo
      : '/index.html';
    window.location.assign(safePath);
  };

  const requestedReturnTo = new URLSearchParams(window.location.search).get('returnTo');

  const submitPin = async (event) => {
    event.preventDefault();
    clearStatus();
    const pin = pinInput.value.trim();

    if (!pin) {
      setStatus('Enter the access PIN to continue.');
      pinInput.focus();
      return;
    }

    setBusy(pinForm.querySelector('button[type="submit"]'), true, 'Unlocking…');
    try {
      const data = await api('/api/auth/pin', {
        method: 'POST',
        body: JSON.stringify({ pin, returnTo: requestedReturnTo })
      });
      setStatus(data.message, 'success');
      window.setTimeout(() => redirectAfterAuth(data.returnTo || requestedReturnTo || '/index.html'), 300);
    } catch (error) {
      setStatus(error.message);
      pinInput.value = '';
      pinInput.focus();
    } finally {
      setBusy(pinForm.querySelector('button[type="submit"]'), false);
    }
  };

  const startGoogle = async () => {
    clearStatus();
    setBusy(googleButton, true, 'Opening Google…');
    try {
      const data = await api('/api/auth/google/start', {
        method: 'POST',
        body: JSON.stringify({ returnTo: requestedReturnTo })
      });
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      setStatus(error.message);
      setBusy(googleButton, false);
    }
  };

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      // The cookie is cleared by the server even if the request fails.
    }

    window.location.assign('/login.html');
  };

  if (pinForm) pinForm.addEventListener('submit', submitPin);
  if (googleButton) googleButton.addEventListener('click', startGoogle);
  if (togglePin) {
    togglePin.addEventListener('click', () => {
      const isPassword = pinInput.type === 'password';
      pinInput.type = isPassword ? 'text' : 'password';
      togglePin.textContent = isPassword ? 'Hide' : 'Show';
      togglePin.setAttribute('aria-label', isPassword ? 'Hide PIN' : 'Show PIN');
    });
  }
  if (logoutButton) logoutButton.addEventListener('click', logout);

  const params = new URLSearchParams(window.location.search);
  const authError = params.get('error');
  if (authError) {
    setStatus(authError);
  } else if (params.get('google') === 'ready') {
    setStatus('Google sign-in complete. Enter your access PIN to finish.', 'success');
  }
})();
