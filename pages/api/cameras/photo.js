// DELETE /api/cameras/[id]/photo  — clears a photo URL field on the camera row
// Called by PhotoUpload component when user deletes a photo

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const { id } = req.body;
  const { photoType } = req.body;

  if (!id || !['install','view'].includes(photoType))
    return res.status(400).json({ error: 'Missing id or invalid photoType' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY)
    return res.status(500).json({ error: 'Missing env vars' });

  const dbField = photoType === 'install' ? 'photo_install_url' : 'screenshot_view_url';

  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/cameras?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ [dbField]: '' }),
  });

  if (!dbRes.ok) {
    const err = await dbRes.text();
    return res.status(500).json({ error: err });
  }

  return res.status(200).json({ ok: true });
}
