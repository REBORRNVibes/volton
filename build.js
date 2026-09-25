// Encrypts every page in _src/ into a password-gated page at the same path.
// The repo is public, so only the encrypted output is committed. _src/ stays local.
//
//   VOLTON_PASS='...' node build.js
//
// AES-GCM 256 with a PBKDF2 key. One salt for the whole site, so one login opens every page.
const fs = require('fs'), path = require('path'), { webcrypto: { subtle }, randomBytes } = require('crypto');

const pass = process.env.VOLTON_PASS;
if (!pass) { console.error('Set VOLTON_PASS'); process.exit(1); }

const root = __dirname, src = path.join(root, '_src');
const ITER = 250000;
const saltFile = path.join(root, 'assets', 'salt.txt');
const salt = fs.existsSync(saltFile) ? Buffer.from(fs.readFileSync(saltFile, 'utf8').trim(), 'base64') : randomBytes(16);
fs.writeFileSync(saltFile, salt.toString('base64') + '\n');

const pages = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) pages.push(p);
  }
})(src);

const shell = (rel, blob) => {
  const up = rel.split('/').length > 1 ? '../'.repeat(rel.split('/').length - 1) : '';
  return `<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Volton Workspace</title>
<link rel="stylesheet" href="${up}assets/site.css">
</head>
<body class="gate">
<main class="login" id="login" hidden>
  <span class="lockup"><img class="lv" src="${up}assets/logo.svg" alt="Volton"><span class="sep"></span><img class="lr" src="${up}assets/reborrn.svg" alt="REBORRN"></span>
  <h1>Workspace</h1>
  <p>Ο κοινός χώρος της Volton και της REBORRN για τα δύο streams, το online acquisition και τον λογαριασμό. Για να συνεχίσετε, γράψτε τον κωδικό πρόσβασης.</p>
  <form id="f">
    <label for="pw">Κωδικός πρόσβασης</label>
    <input id="pw" type="password" autocomplete="current-password" required autofocus>
    <button type="submit">Είσοδος</button>
    <p class="err" id="err" hidden>Ο κωδικός δεν είναι σωστός. Δοκιμάστε ξανά.</p>
  </form>
</main>
<script>
(async () => {
  const B = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const D = ${JSON.stringify(blob)}, S = B(${JSON.stringify(salt.toString('base64'))}), K = 'volton-key';
  const open = async raw => {
    const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
    const out = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: B(D.iv) }, key, B(D.ct));
    const html = new TextDecoder().decode(out);
    if (document.readyState !== 'complete') await new Promise(r => addEventListener('load', r, { once: true }));
    document.open(); document.write(html); document.close();
  };
  try { const k = localStorage.getItem(K); if (k) { await open(B(k)); return; } } catch (e) { try { localStorage.removeItem(K) } catch (_) {} }
  document.getElementById('login').hidden = false;
  document.getElementById('f').addEventListener('submit', async ev => {
    ev.preventDefault();
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(document.getElementById('pw').value), 'PBKDF2', false, ['deriveBits']);
    const raw = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: S, iterations: ${ITER} }, base, 256));
    try {
      await open(raw);
      try { localStorage.setItem(K, btoa(String.fromCharCode(...raw))) } catch (_) {}
    } catch (e) { document.getElementById('err').hidden = false; }
  });
})();
</script>
</body>
</html>
`;
};

(async () => {
  const base = await subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
  const raw = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER }, base, 256);
  const key = await subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
  for (const p of pages) {
    const rel = path.relative(src, p).split(path.sep).join('/');
    const iv = randomBytes(12);
    const ct = Buffer.from(await subtle.encrypt({ name: 'AES-GCM', iv }, key, fs.readFileSync(p)));
    const out = path.join(root, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, shell(rel, { iv: iv.toString('base64'), ct: ct.toString('base64') }));
    console.log('encrypted', rel);
  }
})();
