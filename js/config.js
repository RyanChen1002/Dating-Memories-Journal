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

// =========================================================================
// ENTERPRISE SECURITY: IMMUTABLE AUDIT LOGGING ENGINE (Rules 3a, 3b, 3c)
// =========================================================================
window.logEvent = async function(eventType, eventMessage, eventData = {}) {
    if (!window.supabaseClient) return;

    try {
        // Fetch current user securely
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        const userId = session?.user?.id || null;

        // Fire & Forget insert to immutable audit table
        const { error } = await window.supabaseClient.from('audit_logs').insert([{
            event_type: eventType,
            event_message: eventMessage,
            event_data: eventData,
            user_id: userId
            // created_at is automatically handled by Postgres ISO-8601 clock
        }]);

        if (error) {
            console.error('[Audit System Failure] Immutable log rejected:', error.message);
        } else {
            console.log(`[Audit] Logged: ${eventType} - ${eventMessage}`);
        }
    } catch (e) {
        console.error('[Audit System Crash] Failed to route internal event:', e);
    }
};
