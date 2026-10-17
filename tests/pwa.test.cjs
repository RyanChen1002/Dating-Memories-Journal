const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file));

function pngDimensions(file) {
    const bytes = read(file);
    assert.equal(bytes.toString('ascii', 1, 4), 'PNG', `${file} is not a PNG`);
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test('manifest defines an installable standalone app and valid icons', () => {
    const manifest = JSON.parse(read('manifest.json').toString('utf8'));
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.start_url, '/index.html');
    assert.equal(manifest.scope, '/');

    for (const size of [192, 512]) {
        const icon = manifest.icons.find((item) => item.sizes === `${size}x${size}`);
        assert.ok(icon, `missing ${size}px manifest icon`);
        assert.deepEqual(pngDimensions(icon.src), { width: size, height: size });
    }
});

test('journal and authentication pages expose PWA metadata', () => {
    for (const file of ['index.html', 'auth.html']) {
        const html = read(file).toString('utf8');
        assert.match(html, /rel="manifest" href="manifest\.json"/);
        assert.match(html, /rel="apple-touch-icon"[^>]+apple-touch-icon\.png/);
        assert.match(html, /src="js\/pwa\.js\?v=25"/);
        assert.match(html, /data-install-app/);
    }
    assert.deepEqual(pngDimensions('assets/apple-touch-icon.png'), { width: 180, height: 180 });
    assert.deepEqual(pngDimensions('assets/favicon-32.png'), { width: 32, height: 32 });
});

test('mobile journal exposes atmosphere controls without opening the profile panel', () => {
    const html = read('index.html').toString('utf8');
    const css = read('css/journal.css').toString('utf8');
    const features = read('js/journal-features.js').toString('utf8');
    assert.match(html, /id="mobileAtmosphereSelect"/);
    assert.match(css, /@media\(max-width:1100px\)[\s\S]*\.mobile-quick-actions \{ display:grid/);
    assert.match(css, /#vanta-bg \{ z-index:0!important; pointer-events:none; \}/);
    assert.doesNotMatch(css, />:not\(#vanta-bg\) \{ position:relative/);
    assert.match(features, /mobileAtmosphereSelect['"]\)\?\.addEventListener\('change'/);
});

test('memory editor uses a fixed five-level mood index and description copy', () => {
    const html = read('index.html').toString('utf8');
    const css = read('css/journal.css').toString('utf8');
    const memory = read('js/memory.js').toString('utf8');
    const i18n = read('js/i18n.js').toString('utf8');
    assert.match(html, /id="moodIndex" min="1" max="5"/);
    assert.doesNotMatch(html, /mood-pill|customMoodInput/);
    assert.match(css, /#addMemoryModal \.modal-content \{[^}]*animation:none!important/);
    assert.match(css, /#addMemoryModal \{ position:fixed!important; inset:0;/);
    assert.match(memory, /const moodScale=\['😌','🙂','😊','🥰','😍'\]/);
    assert.match(i18n, /"caption": "描述"/);
    assert.doesNotMatch(i18n, /这个瞬间/);
});

test('service worker caches only the same-origin public app shell', () => {
    const worker = read('service-worker.js').toString('utf8');
    assert.match(worker, /url\.origin !== self\.location\.origin/);
    assert.match(worker, /request\.method !== 'GET'/);
    assert.doesNotMatch(worker, /supabase/i);
    assert.doesNotMatch(worker, /googleapis/i);
});
