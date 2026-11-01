// GET /api/auth – starts "Log ind med GitHub" for the admin at /admin/ (keeps the whole login on livelayer.dk).
export default async (req) => {
  const url = new URL(req.url);
  if (!process.env.GITHUB_CLIENT_ID) return new Response('Login is not configured', { status: 503 });
  const state = crypto.randomUUID();
  const gh = new URL('https://github.com/login/oauth/authorize');
  gh.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID);
  gh.searchParams.set('redirect_uri', `${url.origin}/api/callback`);
  gh.searchParams.set('scope', url.searchParams.get('scope') || 'repo,user');
  gh.searchParams.set('state', state);
  return new Response(null, {
    status: 302,
    headers: { Location: gh.toString(), 'Set-Cookie': `ll_oauth=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600` },
  });
};
export const config = { path: '/api/auth' };
