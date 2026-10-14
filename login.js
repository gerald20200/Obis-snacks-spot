// Your Supabase Configuration
const SUPABASE_URL = 'https://osbreefsoitfgsyjhppf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mP6Hia2ExVYw_Gg9yot_Vg_WKva_f-M';

// Initialize Supabase using the CDN global object
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Listen for login form submission
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop page from refreshing

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Send the sign-in request to Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert('Login failed: ' + error.message);
      return;
    }

    alert('Success! Welcome back.');
    window.location.href = 'dashboard.html';
  });
}