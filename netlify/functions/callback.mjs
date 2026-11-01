// GET /api/callback – GitHub sends the user back here; we swap the code for a token and hand it to the admin window.
const page = (origin, status, payload) => `<!doctype html><meta charset="utf-8"><title>LiveLayer</title>
<body style="font-family:system-ui,sans-serif;background:#fbf8f3;color:#1d1a17;display:grid;place-items:center;height:100vh;margin:0">
<p>${status === 'success' ? 'Logger ind …' : 'Login mislykkedes. Luk vinduet og prøv igen.'}</p>
<script>
(function () {
  var msg = 'authorization:github:${status}:' + ${JSON.stringify(JSON.stringify(payload))};
  function receive(e) {
    if (e.origin !== ${JSON.stringify(origin)}) return;
    window.opener.postMessage(msg, e.origin);
    window.removeEventListener('message', receive, false);
  }
  window.addEventListener('message', receive, false);
  if (window.opener) window.opener.postMessage('authorizing:github', ${JSON.stringify(origin)});
})();
</script></body>`;

export default async (req) => {
  const url = new URL(req.url);
  const html = (status, payload, code = 200) => new Response(page(url.origin, status, payload), {
    status: code, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'll_oauth=; Path=/api; Max-Age=0; HttpOnly; Secure; SameSite=Lax' },
  });
  const cookie = (req.headers.get('cookie') || '').match(/(?:^|;\s*)ll_oauth=([^;]+)/);
  const code = url.searchParams.get('code');
  if (!code || !cookie || cookie[1] !== url.searchParams.get('state')) return html('error', { error: 'state' }, 400);
  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${url.origin}/api/callback` }),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.access_token) return html('error', { error: data.error || 'token' }, 400);
  return html('success', { token: data.access_token, provider: 'github' });
};
export const config = { path: '/api/callback' };
