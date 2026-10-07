// Phase 2: Authentication & Routing Logic using Supabase Auth

document.addEventListener('DOMContentLoaded', async () => {
    
    const sb = window.supabaseClient;
    const isAuthPage = window.location.pathname.includes('auth.html');

    // --- ROUTING GUARD ---
    // Check if user is already logged in
    const { data: { session } } = await sb.auth.getSession();

    // If NOT logged in and NOT on auth page → kick to login
    if (!session && !isAuthPage) {
        window.location.href = 'auth.html';
        return;
    }

    // If logged in and ON auth page → send to timeline
    if (session && isAuthPage) {
        window.location.href = 'index.html';
        return;
    }

    // --- AUTH PAGE LOGIC ---
    if (isAuthPage) {
        const form = document.getElementById('authForm');
        const emailInput = document.getElementById('email');
        const passInput = document.getElementById('password');
        const submitBtn = document.getElementById('authSubmitBtn');
        const statusMsg = document.getElementById('statusMessage');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            const password = passInput.value;

            // Validate password length
            if (password.length < 6) {
                showStatus('Password must be at least 6 characters.', 'error');
                return;
            }

            // Disable button while processing
            submitBtn.disabled = true;
            submitBtn.textContent = 'Connecting...';

            // Step 1: Try to LOG IN first
            const { data: loginData, error: loginError } = await sb.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (loginData.session) {
                // Login success! Redirect immediately.
                window.logEvent('auth', 'User successfully authenticated via existing account', { email: email });
                
                showStatus('Welcome back! Syncing your memories...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 800);
                return;
            }

            // Step 2: If login failed because user doesn't exist, SIGN UP
            if (loginError && loginError.message.includes('Invalid login credentials')) {
                showStatus('Creating your new couple account...', 'info');

                const { data: signUpData, error: signUpError } = await sb.auth.signUp({
                    email: email,
                    password: password
                });

                if (signUpError) {
                    showStatus(signUpError.message, 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Begin Sync';
                    return;
                }

                // Check if email confirmation is required
                if (signUpData.user && !signUpData.session) {
                    showStatus('Account created! Check your email to confirm, then log in.', 'success');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Begin Sync';
                    return;
                }

                // Auto-confirmed (no email verification needed)
                if (signUpData.session) {
                    window.logEvent('auth_create', 'New couple account successfully registered', { email: email });
                    
                    showStatus('Account created! Syncing...', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 800);
                    return;
                }
            }

            // Step 3: Some other error
            showStatus(loginError ? loginError.message : 'Something went wrong. Try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Begin Sync';
        });

        function showStatus(msg, type) {
            statusMsg.textContent = msg;
            statusMsg.className = 'status-message ' + type;
            statusMsg.classList.remove('hidden');
        }
    }

    // --- LOGOUT (runs on index.html) ---
    if (!isAuthPage) {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                window.logEvent('auth_logout', 'User manually initiated logout sequence');
                await sb.auth.signOut();
                window.location.href = 'auth.html';
            });
        }
    }
});
