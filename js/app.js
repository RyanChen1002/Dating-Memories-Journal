// Phase 2: Authentication & Routing Logic using Supabase Auth

document.addEventListener('DOMContentLoaded', async () => {
    
    const sb = window.supabaseClient;
    const isAuthPage = window.location.pathname.includes('auth.html');

    // Check if recovery link is being visited
    const isRecovery = window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery');

    // --- ROUTING GUARD ---
    // Check if user is already logged in
    const { data: { session } } = await sb.auth.getSession();

    // If NOT logged in and NOT on auth page → kick to login
    if (!session && !isAuthPage) {
        window.location.href = 'auth.html';
        return;
    }

    // If logged in and ON auth page, AND not recovering password → send to timeline
    if (session && isAuthPage && !isRecovery) {
        window.location.href = 'index.html';
        return;
    }

    // --- AUTH PAGE LOGIC ---
    if (isAuthPage) {
        const authSection = document.getElementById('authSection');
        const resetSection = document.getElementById('resetSection');
        const newPasswordSection = document.getElementById('newPasswordSection');

        const form = document.getElementById('authForm');
        const emailInput = document.getElementById('email');
        const passInput = document.getElementById('password');
        const submitBtn = document.getElementById('authSubmitBtn');
        const statusMsg = document.getElementById('statusMessage');

        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        const backToLoginLink = document.getElementById('backToLoginLink');
        const resetForm = document.getElementById('resetForm');
        const resetEmailInput = document.getElementById('resetEmail');
        const resetSubmitBtn = document.getElementById('resetSubmitBtn');

        const newPasswordForm = document.getElementById('newPasswordForm');
        const newPasswordInput = document.getElementById('newPasswordInput');
        const newPasswordSubmitBtn = document.getElementById('newPasswordSubmitBtn');

        function showStatus(msg, type) {
            statusMsg.textContent = msg;
            statusMsg.className = 'status-message ' + type;
            statusMsg.classList.remove('hidden');
        }

        function switchTo(section) {
            if (authSection) authSection.classList.add('hidden');
            if (resetSection) resetSection.classList.add('hidden');
            if (newPasswordSection) newPasswordSection.classList.add('hidden');
            if (statusMsg) statusMsg.classList.add('hidden');
            if (section) section.classList.remove('hidden');
        }

        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (resetEmailInput && emailInput) {
                    resetEmailInput.value = emailInput.value.trim();
                }
                switchTo(resetSection);
            });
        }

        if (backToLoginLink) {
            backToLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                switchTo(authSection);
            });
        }

        // Handle Password Reset Request
        if (resetForm) {
            resetForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = resetEmailInput.value.trim();
                if (!email) {
                    showStatus('Please enter your email address.', 'error');
                    return;
                }

                resetSubmitBtn.disabled = true;
                resetSubmitBtn.textContent = 'Sending...';

                const redirectUrl = window.location.origin.includes('localhost')
                    ? window.location.origin + '/auth.html'
                    : 'https://dating-memories-journal.vercel.app/auth.html';

                const { error } = await sb.auth.resetPasswordForEmail(email, {
                    redirectTo: redirectUrl
                });

                resetSubmitBtn.disabled = false;
                const lang = localStorage.getItem('lang') || 'en';
                resetSubmitBtn.textContent = (window.translations && window.translations[lang] && window.translations[lang]['send_reset_btn']) || 'Send Reset Link 📧';

                if (error) {
                    showStatus(error.message, 'error');
                } else {
                    showStatus(
                        lang === 'zh'
                            ? '📧 重置链接已发送到你的邮箱！请查收邮件并点击链接设置新密码。'
                            : '📧 Password reset link sent! Check your email to set your new password.',
                        'success'
                    );
                }
            });
        }

        // Listen for Supabase PASSWORD_RECOVERY event
        sb.auth.onAuthStateChange(async (event) => {
            if (event === 'PASSWORD_RECOVERY') {
                switchTo(newPasswordSection);
                const lang = localStorage.getItem('lang') || 'en';
                showStatus(
                    lang === 'zh'
                        ? '请在下方输入你的新密码。'
                        : 'Please enter your new password below.',
                    'info'
                );
            }
        });

        // Direct hash check for recovery link
        if (isRecovery) {
            switchTo(newPasswordSection);
            const lang = localStorage.getItem('lang') || 'en';
            showStatus(
                lang === 'zh'
                    ? '请在下方输入你的新密码。'
                    : 'Please enter your new password below.',
                'info'
            );
        }

        // Handle Set New Password
        if (newPasswordForm) {
            newPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newPass = newPasswordInput.value;
                if (newPass.length < 6) {
                    showStatus('Password must be at least 6 characters.', 'error');
                    return;
                }

                newPasswordSubmitBtn.disabled = true;
                newPasswordSubmitBtn.textContent = 'Updating...';

                const { error } = await sb.auth.updateUser({
                    password: newPass
                });

                const lang = localStorage.getItem('lang') || 'en';
                if (error) {
                    showStatus(error.message, 'error');
                    newPasswordSubmitBtn.disabled = false;
                    newPasswordSubmitBtn.textContent = (window.translations && window.translations[lang] && window.translations[lang]['update_pass_btn']) || 'Update Password & Log In ✨';
                } else {
                    showStatus(
                        lang === 'zh'
                            ? '🎉 密码更新成功！正在进入日记...'
                            : '🎉 Password updated successfully! Entering your journal...',
                        'success'
                    );
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            });
        }

        if (form) {
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

                    // BUG FIX 1: Use the live Vercel URL as the redirect target.
                    // Falls back to current origin so it works on both localhost and production.
                    const redirectUrl = window.location.origin.includes('localhost')
                        ? window.location.origin + '/auth.html'
                        : 'https://dating-memories-journal.vercel.app/auth.html';

                    const { data: signUpData, error: signUpError } = await sb.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            emailRedirectTo: redirectUrl
                        }
                    });

                    if (signUpError) {
                        showStatus(signUpError.message, 'error');
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Begin Sync';
                        return;
                    }

                    // Check if email confirmation is required
                    if (signUpData.user && !signUpData.session) {
                        showStatus('📧 Check your email inbox! We sent you a confirmation link to activate your couple account. Once confirmed, come back and log in.', 'success');
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
