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
        assert.match(html, /src="js\/pwa\.js\?v=24"/);
    }
    assert.deepEqual(pngDimensions('assets/apple-touch-icon.png'), { width: 180, height: 180 });
    assert.deepEqual(pngDimensions('assets/favicon-32.png'), { width: 32, height: 32 });
});

test('service worker caches only the same-origin public app shell', () => {
    const worker = read('service-worker.js').toString('utf8');
    assert.match(worker, /url\.origin !== self\.location\.origin/);
    assert.match(worker, /request\.method !== 'GET'/);
    assert.doesNotMatch(worker, /supabase/i);
    assert.doesNotMatch(worker, /googleapis/i);
});
