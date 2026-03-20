// GET  /api/settings         — returns { projectName, totalCameras }
// PUT  /api/settings         — body: { projectName?, totalCameras? }

const SUPABASE_URL = () => process.env.SUPABASE_URL;
const SUPABASE_KEY = () => process.env.SUPABASE_SERVICE_KEY;

const headers = () => ({
  apikey: SUPABASE_KEY(),
  Authorization: `Bearer ${SUPABASE_KEY()}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
});

const DEFAULTS = { project_name: 'Camera Upgrade Project', total_cameras: 211 };

async function getRow() {
  const res = await fetch(`${SUPABASE_URL()}/rest/v1/settings?select=*&limit=1`, {
    headers: headers(),
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

export default async function handler(req, res) {
  if (!SUPABASE_URL() || !SUPABASE_KEY())
    return res.status(500).json({ error: 'Missing env vars' });

  if (req.method === 'GET') {
    const row = await getRow();
    if (!row) return res.status(200).json({ projectName: DEFAULTS.project_name, totalCameras: DEFAULTS.total_cameras });
    return res.status(200).json({ projectName: row.project_name, totalCameras: row.total_cameras });
  }

  if (req.method === 'PUT') {
    const { projectName, totalCameras } = req.body;
    const existing = await getRow();

    const payload = {
      project_name:   projectName   ?? existing?.project_name   ?? DEFAULTS.project_name,
      total_cameras:  totalCameras  ?? existing?.total_cameras  ?? DEFAULTS.total_cameras,
    };

    let dbRes;
    if (existing) {
      // Update existing row
      dbRes = await fetch(`${SUPABASE_URL()}/rest/v1/settings?id=eq.${existing.id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(payload),
      });
    } else {
      // Insert first row
      dbRes = await fetch(`${SUPABASE_URL()}/rest/v1/settings`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      });
    }

    if (!dbRes.ok) {
      const err = await dbRes.text();
      return res.status(500).json({ error: err });
    }

    return res.status(200).json({ projectName: payload.project_name, totalCameras: payload.total_cameras });
  }

  return res.status(405).end();
}
