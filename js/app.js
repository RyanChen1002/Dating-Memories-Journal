/* Authentication: login and signup are explicit, independent actions. */
document.addEventListener('DOMContentLoaded', async () => {
    const sb=window.supabaseClient, authPage=window.location.pathname.includes('auth.html'), $=id=>document.getElementById(id);
    if(!sb){if($('statusMessage')){$('statusMessage').textContent='连接服务暂不可用 / Connection unavailable';$('statusMessage').className='status-message error';}return;}
    const copy={
        login:['Log In','登录'],signup:['Create New Account','创建新账户'],connecting:['Connecting…','正在连接…'],short:['Password must be at least 6 characters.','密码至少需要6个字符。'],
        incorrect:['Incorrect email or password. Please try again or reset your password.','邮箱或密码不正确，请重试或重置密码。'],welcome:['Welcome! Opening your journal…','登录成功，正在进入日记…'],
        register:['If registration is available, check your email for confirmation. Already have an account? Log in or reset your password.','如果可以注册，请查看邮箱中的确认邮件。已有账户？请登录或重置密码。'],
        network:['Connection failed. Please try again.','连接失败，请重试。'],reset:['Send Reset Link','发送重置链接'],sending:['Sending…','正在发送…'],
        reset_sent:['If an account exists, a recovery email will be sent. Check your inbox and spam folder.','如果账户存在，系统将发送找回邮件，请检查收件箱和垃圾邮件。'],
        update:['Update Password & Log In','更新密码并登录'],updating:['Updating…','正在更新…'],updated:['Password updated. Opening your journal…','密码已更新，正在进入日记…'],
        expired:['Recovery session is missing or expired. Request a new link.','找回会话无效或已过期，请重新申请链接。'],recovery:['Enter your new password below.','请在下方输入新密码。'],
        show:['Show password','显示密码'],hide:['Hide password','隐藏密码'],logout:['Log Out','登出']
    };
    const tr=k=>copy[k][window.currentLang==='zh'?1:0];
    let lastStatus=null, mode='authSection',busy=false,resetBusy=false,updateBusy=false;
    let recovery=!!window.authRecovery||window.location.hash.includes('type=recovery')||window.location.search.includes('type=recovery');
    function status(key,type='info',raw=false){lastStatus={key,type,raw};if($('statusMessage')){$('statusMessage').textContent=raw?key:tr(key);$('statusMessage').className='status-message '+type;}}
    function show(section){mode=section;for(const id of ['authSection','resetSection','newPasswordSection']){const n=$(id);if(n)n.classList.toggle('hidden',id!==section);}if($('statusMessage'))$('statusMessage').classList.add('hidden');lastStatus=null;}
    const onRecovery=()=>{recovery=true;if(authPage){show('newPasswordSection');status('recovery');}};
    // Subscribe before awaiting SDK initialization/session lookup.
    sb.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')onRecovery();});
    document.addEventListener('journal:recovery',onRecovery);
    try{
        const {data,error}=await sb.auth.getSession();if(error)throw error;
        recovery=recovery||!!window.authRecovery;
        if(!authPage&&!data?.session){window.location.href='auth.html';return;}
        if(authPage&&data?.session&&!recovery){window.location.href='index.html';return;}
    }catch(e){if(authPage)status('network','error');else window.location.href='auth.html';}
    if(!authPage){
        const logout=$('logoutBtn');logout?.addEventListener('click',async()=>{
            if(logout.disabled)return;logout.disabled=true;
            try{const {error}=await sb.auth.signOut({scope:'local'});if(error)throw error;window.location.href='auth.html';}
            catch(e){const n=$('journalNotice');if(n){n.textContent=tr('network');n.className='app-notice error';}logout.disabled=false;}
        });return;
    }
    if(recovery){show('newPasswordSection');status('recovery');}
    if(window.location.hash.includes('error=')||window.location.search.includes('error=')){show('resetSection');status('expired','error');}
    $('statusMessage')?.setAttribute('role','status');$('statusMessage')?.setAttribute('aria-live','polite');
    for(const id of ['password','newPasswordInput']){
        const input=$(id);if(!input)continue;input.autocomplete=id==='password'?'current-password':'new-password';
        const b=document.createElement('button');b.type='button';b.className='password-toggle';b.dataset.passwordToggle=id;b.setAttribute('aria-controls',id);b.setAttribute('aria-pressed','false');b.textContent=tr('show');
        b.addEventListener('click',()=>{const reveal=input.type==='password';input.type=reveal?'text':'password';b.setAttribute('aria-pressed',String(reveal));b.textContent=tr(reveal?'hide':'show');});input.after(b);
    }
    $('email').autocomplete='email';$('resetEmail').autocomplete='email';
    function labels(){
        $('authSubmitBtn').textContent=tr(busy?'connecting':'login');if($('signupSubmitBtn'))$('signupSubmitBtn').textContent=tr('signup');
        $('resetSubmitBtn').textContent=tr(resetBusy?'sending':'reset');$('newPasswordSubmitBtn').textContent=tr(updateBusy?'updating':'update');
        document.querySelectorAll('[data-password-toggle]').forEach(b=>b.textContent=tr($(b.dataset.passwordToggle).type==='text'?'hide':'show'));
        if(lastStatus)status(lastStatus.key,lastStatus.type,lastStatus.raw);
    }
    document.addEventListener('languagechange',labels);labels();
    $('forgotPasswordLink').addEventListener('click',e=>{e.preventDefault();if(busy)return;$('resetEmail').value=$('email').value.trim();show('resetSection');$('resetEmail').focus();});
    $('backToLoginLink').addEventListener('click',e=>{e.preventDefault();if(resetBusy)return;show('authSection');$('email').focus();});
    $('resetForm').addEventListener('submit',async e=>{
        e.preventDefault();if(resetBusy)return;resetBusy=true;$('resetSubmitBtn').disabled=true;labels();
        try{const {error}=await sb.auth.resetPasswordForEmail($('resetEmail').value.trim(),{redirectTo:new URL('auth.html',window.location.href).href});if(error)throw error;status('reset_sent','success');}
        catch(err){status(err.message||tr('network'),'error',true);}finally{resetBusy=false;$('resetSubmitBtn').disabled=false;labels();}
    });
    $('newPasswordForm').addEventListener('submit',async e=>{
        e.preventDefault();if(updateBusy)return;const password=$('newPasswordInput').value;if(password.length<6){status('short','error');return;}
        updateBusy=true;$('newPasswordSubmitBtn').disabled=true;labels();
        try{const session=await sb.auth.getSession();if(session.error||!session.data?.session){status('expired','error');return;}
            const {error}=await sb.auth.updateUser({password});if(error)throw error;window.authRecovery=false;recovery=false;status('updated','success');setTimeout(()=>{window.location.href='index.html';},800);
        }catch(err){status(err.message||tr('network'),'error',true);}finally{updateBusy=false;$('newPasswordSubmitBtn').disabled=false;labels();}
    });
    $('authForm').addEventListener('submit',async e=>{
        e.preventDefault();if(busy)return;const email=$('email').value.trim(),password=$('password').value;
        if(password.length<6){status('short','error');return;}const signup=e.submitter?.id==='signupSubmitBtn';
        busy=true;$('authSubmitBtn').disabled=true;if($('signupSubmitBtn'))$('signupSubmitBtn').disabled=true;labels();
        try{
            if(signup){const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:new URL('auth.html',window.location.href).href}});if(error)throw error;if(!data?.session){status('register');return;}}
            else{const {data,error}=await sb.auth.signInWithPassword({email,password});if(error){if(error.code==='invalid_credentials'||error.message?.includes('Invalid login credentials'))status('incorrect','error');else status(error.message,'error',true);return;}if(!data?.session)throw new Error(tr('network'));}
            window.logEvent?.(signup?'auth_create':'auth','User authenticated');status('welcome','success');setTimeout(()=>{window.location.href='index.html';},800);
        }catch(err){status(err.message||tr('network'),'error',true);}finally{busy=false;$('authSubmitBtn').disabled=false;if($('signupSubmitBtn'))$('signupSubmitBtn').disabled=false;labels();}
    });
});
