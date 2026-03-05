const SB = () => ({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_KEY });

const headers = () => {
  const { key } = SB();
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
};

const toJS = (r) => ({
  id: r.id,
  name: r.name || '',
  floor: r.floor || '',
  model: r.model || '',
  ip: r.ip || '',
  switchName: r.switch_name || '',
  switchPort: r.switch_port || '',
  photoInstallUrl: r.photo_install_url || '',
  screenshotViewUrl: r.screenshot_view_url || '',
  notes: r.notes || '',
  createdAt: r.created_at,
});

const toDB = (c) => ({
  name: c.name || '',
  floor: c.floor || '',
  model: c.model || '',
  ip: c.ip || '',
  switch_name: c.switchName || '',
  switch_port: c.switchPort || '',
  notes: c.notes || '',
});

export default async function handler(req, res) {
  const { url } = SB();
  if (!url) return res.status(500).json({ error: 'Missing env vars' });

  if (req.method === 'GET') {
    const r = await fetch(`${url}/rest/v1/cameras?order=created_at.asc`, { headers: headers() });
    if (!r.ok) return res.status(500).json({ error: 'Fetch failed' });
    return res.status(200).json((await r.json()).map(toJS));
  }

  if (req.method === 'POST') {
    const r = await fetch(`${url}/rest/v1/cameras`, {
      method: 'POST', headers: headers(), body: JSON.stringify(toDB(req.body)),
    });
    if (!r.ok) return res.status(500).json({ error: 'Create failed' });
    return res.status(201).json(toJS((await r.json())[0]));
  }

  res.status(405).end();
}
