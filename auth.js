(() => {
  const pinForm = document.getElementById('pinForm');
  const pinInput = document.getElementById('accessPin');
  const togglePin = document.getElementById('togglePin');
  const googleButton = document.getElementById('googleButton');
  const emailLoginForm = document.getElementById('emailLoginForm');
  const signupForm = document.getElementById('signupForm');
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

  const getSupabase = () => window.supabaseClient || null;

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

  const persistAuthToken = (token) => {
    if (token) {
      localStorage.setItem('obi_snack_auth_token', token);
    }
  };

  const handleAuthSuccess = (token, returnTo) => {
    persistAuthToken(token);
    window.setTimeout(() => redirectAfterAuth(returnTo || '/index.html'), 300);
  };

  const requestedReturnTo = new URLSearchParams(window.location.search).get('returnTo');

  const submitEmailLogin = async (event) => {
    event.preventDefault();
    clearStatus();

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      setStatus('Email and password are required.');
      return;
    }

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.session) {
        setStatus('Login successful. Redirecting…', 'success');
        handleAuthSuccess(data.session.access_token, requestedReturnTo || '/index.html');
        return;
      }

      if (error) {
        setStatus(error.message);
        passwordInput.value = '';
        emailInput.focus();
        return;
      }
    }

    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, returnTo: requestedReturnTo })
      });

      if (!data.token) {
        throw new Error('No authentication token was returned.');
      }

      setStatus('Login successful. Redirecting…', 'success');
      handleAuthSuccess(data.token, requestedReturnTo || '/index.html');
    } catch (error) {
      setStatus(error.message);
      passwordInput.value = '';
      emailInput.focus();
    }
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    clearStatus();

    const fullName = document.getElementById('signupFullName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setStatus('Please complete every signup field.');
      return;
    }

    if (password.length < 6) {
      setStatus('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role: 'customer'
          }
        }
      });

      if (!error && data?.user) {
        setStatus('Account created successfully. Redirecting…', 'success');
        handleAuthSuccess(data.session?.access_token || '', requestedReturnTo || '/index.html');
        return;
      }

      if (error) {
        setStatus(error.message);
        return;
      }
    }

    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, phone, password, confirmPassword, returnTo: requestedReturnTo })
      });

      if (!data.token) {
        throw new Error('Account created, but no access token was returned.');
      }

      setStatus('Account created successfully. Redirecting…', 'success');
      handleAuthSuccess(data.token, requestedReturnTo || '/index.html');
    } catch (error) {
      setStatus(error.message);
    }
  };

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

    const supabase = getSupabase();
    if (supabase) {
      try {
        const redirectTo = `${window.location.origin}/index.html`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo }
        });

        if (!error) {
          return;
        }

        setStatus(error.message);
        setBusy(googleButton, false);
        return;
      } catch (error) {
        setStatus(error.message);
        setBusy(googleButton, false);
        return;
      }
    }

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
    const supabase = getSupabase();

    try {
      if (supabase) {
        await supabase.auth.signOut();
      } else {
        await api('/api/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      // Ignore logout errors and continue redirect.
    }

    window.location.assign('/login.html');
  };

  if (pinForm) pinForm.addEventListener('submit', submitPin);
  if (googleButton) googleButton.addEventListener('click', startGoogle);
  if (emailLoginForm) emailLoginForm.addEventListener('submit', submitEmailLogin);
  if (signupForm) signupForm.addEventListener('submit', submitSignup);
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
