const SUPABASE_URL = 'https://osbreefsoitfgsyjhppf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mP6Hia2ExVYw_Gg9yot_Vg_WKva_f-M';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.querySelector('form');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('name')?.value || '';
    const email = document.getElementById('email')?.value || '';
    const phone = document.getElementById('phone')?.value || '';
    const password = document.getElementById('password')?.value || '';

    // 1. Create secure login with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      alert('Sign up error: ' + authError.message);
      return;
    }

    // 2. Save their profile details into your 'customers' table
    const userId = authData.user?.id;
    const { error: dbError } = await supabase
      .from('customers')
      .insert([
        { 
          id: userId,
          full_name: fullName, 
          email: email, 
          phone: phone 
        }
      ]);

    if (dbError) {
      alert('Error saving customer profile: ' + dbError.message);
      return;
    }

    alert('Account created and registered successfully!');
  });
}