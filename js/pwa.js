(() => {
    let installPrompt = null;
    const buttons = () => [...document.querySelectorAll('[data-install-app]')];
    const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const ios = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const chinese = () => window.currentLang === 'zh' || document.documentElement.lang === 'zh';
    const showButtons = () => buttons().forEach(button => {
        button.classList.toggle('hidden', standalone());
        button.textContent = chinese() ? '📲 安装应用' : '📲 Install App';
    });

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        installPrompt = event;
        showButtons();
    });

    document.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-install-app]');
        if (!button) return;
        if (installPrompt) {
            installPrompt.prompt();
            await installPrompt.userChoice;
            installPrompt = null;
            showButtons();
            return;
        }
        const message = ios()
            ? (chinese() ? '请使用 Safari 打开网站，点击“分享”，然后选择“添加到主屏幕”。' : 'Open this site in Safari, tap Share, then choose Add to Home Screen.')
            : (chinese() ? '请打开浏览器菜单，然后选择“安装应用”或“添加到主屏幕”。' : 'Open your browser menu, then choose Install app or Add to Home screen.');
        alert(message);
    });

    window.addEventListener('appinstalled', () => { installPrompt = null; showButtons(); });
    document.addEventListener('DOMContentLoaded', showButtons);
    document.addEventListener('languagechange', showButtons);

    if ('serviceWorker' in navigator) window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch((error) => {
            console.warn('PWA service worker registration failed:', error);
        });
    });
})();
