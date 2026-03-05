export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password, role } = req.body;

  const trackerPass = process.env.TRACKER_PASSWORD;
  const dashboardPass = process.env.DASHBOARD_PASSWORD;

  const valid =
    (role === 'tracker' && password === trackerPass) ||
    (role === 'dashboard' && password === dashboardPass);

  if (!valid) return res.status(401).json({ error: 'Invalid password' });

  const cookieName = role === 'tracker' ? 'tracker_auth' : 'dashboard_auth';
  // Cookie lasts 8 hours
  res.setHeader(
    'Set-Cookie',
    `${cookieName}=ok; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`
  );
  return res.status(200).json({ ok: true });
}
