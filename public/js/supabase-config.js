// This file is loaded as a classic script after the Supabase CDN bundle.
const supabaseUrl = 'https://ouriduvcnenodechrgau.supabase.co';
const supabaseAnonKey = 'sb_publishable_xFRY5RTHxaBzjtcuaw_y3Q_9NoDmTWd';

if (window.supabase?.createClient) {
	window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
} else {
	console.error('Supabase CDN did not load; order submission cannot use Supabase.');
}
