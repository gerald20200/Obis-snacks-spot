(function () {
  const config = window.SUPABASE_CONFIG || {
    url: 'https://your-project-ref.supabase.co',
    anonKey: 'your-anon-key'
  };

  if (!config.url || !config.anonKey || config.url.includes('your-project-ref') || config.anonKey.includes('your-anon-key')) {
    console.warn('Supabase is not configured yet. Replace the placeholders in window.SUPABASE_CONFIG or supabase-config.js.');
    return;
  }

  if (!window.supabase) {
    console.warn('Supabase JavaScript client was not loaded. Make sure the CDN script is included before this file.');
    return;
  }

  window.supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
})();
