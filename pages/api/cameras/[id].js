const headers = () => {
  const key = process.env.SUPABASE_SERVICE_KEY;
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
  serialNumber: r.serial_number || '',
  photoInstallUrl: r.photo_install_url || '',
  screenshotViewUrl: r.screenshot_view_url || '',
  notes: r.notes || '',
  createdAt: r.created_at,
});

// Only update text/metadata fields — photo URLs are managed by the upload API
const toDB = (c) => ({
  name: c.name || '',
  floor: c.floor || '',
  model: c.model || '',
  ip: c.ip || '',
  switch_name: c.switchName || '',
  switch_port: c.switchPort || '',
  notes: c.notes || '',
  serial_number: c.serialNumber || '',
});

export default async function handler(req, res) {
  const { id } = req.query;
  const base = `${process.env.SUPABASE_URL}/rest/v1/cameras?id=eq.${id}`;

  if (req.method === 'PUT') {
    const r = await fetch(base, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(toDB(req.body)),
    });
    if (!r.ok) return res.status(500).json({ error: 'Update failed' });
    const rows = await r.json();
    if (!rows || rows.length === 0) return res.status(200).json({ ok: true });
    return res.status(200).json(toJS(rows[0]));
  }

  if (req.method === 'DELETE') {
    const r = await fetch(base, { method: 'DELETE', headers: headers() });
    if (!r.ok) return res.status(500).json({ error: 'Delete failed' });
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
