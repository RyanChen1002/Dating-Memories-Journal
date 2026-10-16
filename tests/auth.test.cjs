const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function setup({ loginError, throws, session, language = 'en', recovery = false, resetThrows = false, initialSession = null } = {}) {
    const elements = new Map();
    const calls = { login: 0, signup: 0 };
    const element = id => {
        if (!elements.has(id)) elements.set(id, {
            value: '', disabled: false, textContent: '', handlers: {}, dataset: {}, type: 'password',
            classList: { add() {}, remove() {}, toggle() {} },
            setAttribute() {}, after() {}, focus() {},
            addEventListener(event, callback) { this.handlers[event] = callback; }
        });
        return elements.get(id);
    };
    let ready;
    const location = { pathname: '/auth.html', hash: '', search: '', origin: 'http://localhost:8080', href: 'http://localhost:8080/auth.html' };
    let authListener;
    const auth = {
        getSession: async () => { if(recovery)authListener?.('PASSWORD_RECOVERY'); return { data: { session: initialSession } }; },
        onAuthStateChange(listener) { authListener = listener; },
        resetPasswordForEmail: async () => { if(resetThrows)throw new Error('Reset offline'); return {error:null}; },
        updateUser: async () => { calls.update=(calls.update||0)+1; return {error:null}; },
        signInWithPassword: async () => {
            calls.login++;
            if (throws) throw new Error('Network unavailable');
            return { data: { session }, error: loginError };
        },
        signUp: async () => { calls.signup++; return { data: { user: {}, session: null }, error: null }; }
    };
    vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../js/app.js'), 'utf8'), {
        window: { location, currentLang: language, supabaseClient: { auth }, logEvent() {} },
        document: { getElementById: element, createElement: () => element('generated-' + elements.size), querySelectorAll: () => [], addEventListener: (name, callback) => { if(name==='DOMContentLoaded')ready = callback; } },
        localStorage: { getItem: () => language }, URL, setTimeout: callback => callback()
    });
    await ready();
    element('email').value = 'test@example.invalid';
    element('password').value = 'test-password-only';
    return { element, calls, location, submit: id => element('authForm').handlers.submit({ preventDefault() {}, submitter: { id } }) };
}

test('wrong password shows error and NEVER registers an account', async () => {
    const app = await setup({ loginError: { code: 'invalid_credentials', message: 'Invalid login credentials' } });
    await app.submit('authSubmitBtn');
    assert.equal(app.calls.login, 1);
    assert.equal(app.calls.signup, 0);
    assert.match(app.element('statusMessage').textContent, /Incorrect email or password/);
    assert.equal(app.element('authSubmitBtn').disabled, false);
});
test('Enter submission defaults to login, never signup', async () => {
    const app = await setup({ loginError: { message: 'Invalid login credentials' } });
    await app.submit(undefined);
    assert.equal(app.calls.signup, 0);
});
test('explicit registration invokes signup only', async () => {
    const app = await setup();
    await app.submit('signupSubmitBtn');
    assert.deepEqual(app.calls, { login: 0, signup: 1 });
    assert.match(app.element('statusMessage').textContent, /If registration is available/);
});
test('successful login opens journal', async () => {
    const app = await setup({ session: { user: { id: 'test' } } });
    await app.submit('authSubmitBtn');
    assert.equal(app.location.href, 'index.html');
    assert.equal(app.calls.signup, 0);
});
test('network failures reenable both buttons', async () => {
    const app = await setup({ throws: true });
    await app.submit('authSubmitBtn');
    assert.equal(app.element('authSubmitBtn').disabled, false);
    assert.equal(app.element('signupSubmitBtn').disabled, false);
    assert.match(app.element('statusMessage').textContent, /Network unavailable/);
});
test('invalid login is localized in Chinese', async () => {
    const app = await setup({ language: 'zh', loginError: { message: 'Invalid login credentials' } });
    await app.submit('authSubmitBtn');
    assert.match(app.element('statusMessage').textContent, /邮箱或密码不正确/);
});
test('recovery event during session initialization prevents timeline redirect', async () => {
    const app=await setup({recovery:true,initialSession:{user:{id:'test'}}});
    assert.equal(app.location.href,'http://localhost:8080/auth.html');
    assert.match(app.element('statusMessage').textContent,/new password/);
});
test('reset network failure reenables submit',async()=>{
    const app=await setup({resetThrows:true});
    await app.element('resetForm').handlers.submit({preventDefault(){}});
    assert.equal(app.element('resetSubmitBtn').disabled,false);
    assert.match(app.element('statusMessage').textContent,/Reset offline/);
});
test('expired recovery cannot update password',async()=>{
    const app=await setup({recovery:true});app.element('newPasswordInput').value='new-test-password';
    await app.element('newPasswordForm').handlers.submit({preventDefault(){}});
    assert.equal(app.calls.update||0,0);
    assert.match(app.element('statusMessage').textContent,/expired/);
});
test('valid recovery updates password and opens timeline',async()=>{
    const app=await setup({recovery:true,initialSession:{user:{id:'test'}}});app.element('newPasswordInput').value='new-test-password';
    await app.element('newPasswordForm').handlers.submit({preventDefault(){}});
    assert.equal(app.calls.update,1);assert.equal(app.location.href,'index.html');
});
