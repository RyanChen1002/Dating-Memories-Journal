// Phase 1 Task 3: Supabase Configuration

const SUPABASE_URL = 'https://gtmlpbmuhtfrsnkwejey.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_v2RDnaHW99O5OrzrIaH9Jw_v8x74JOH';

// Initialize Supabase. This creates a global 'supabase' object we can access in our other JS files.
if (typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase library successfully loaded and configured.");
} else {
    console.error("Supabase script tag is missing from index.html!");
}
