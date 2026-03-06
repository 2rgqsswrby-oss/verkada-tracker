export const config = {
  api: {
    // After client-side compression photos are well under 2MB,
    // but keep limit generous for any edge cases
    bodyParser: { sizeLimit: '6mb' },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id, photoData, mimeType, photoType } = req.body;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY)
    return res.status(500).json({ error: 'Missing Supabase env vars' });

  if (!id)
    return res.status(400).json({ error: 'Missing camera id' });

  if (!photoData)
    return res.status(400).json({ error: 'Missing photo data' });

  if (!['install', 'view'].includes(photoType))
    return res.status(400).json({ error: 'Invalid photoType — must be install or view' });

  let buffer;
  try {
    buffer = Buffer.from(photoData, 'base64');
  } catch (e) {
    return res.status(400).json({ error: 'Invalid base64 data' });
  }

  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const fileName = `${id}/${photoType}-${Date.now()}.${ext}`;

  // 1 — Upload binary to Supabase Storage
  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/camera-photos/${fileName}`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': mimeType || 'image/jpeg',
        'x-upsert': 'true',
      },
      body: buffer,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    return res.status(500).json({ error: `Storage upload failed: ${err}` });
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/camera-photos/${fileName}`;

  // 2 — Update the cameras row with the new URL
  const dbField = photoType === 'install' ? 'photo_install_url' : 'screenshot_view_url';

  const dbRes = await fetch(
    `${SUPABASE_URL}/rest/v1/cameras?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ [dbField]: publicUrl }),
    }
  );

  if (!dbRes.ok) {
    const err = await dbRes.text();
    // Storage upload succeeded — return the URL anyway so the UI doesn't get stuck,
    // but include a warning so it can be surfaced if needed
    console.error('DB update failed after successful storage upload:', err);
    return res.status(500).json({
      error: `Photo saved to storage but DB update failed: ${err}`,
      url: publicUrl, // include url so client can still show the photo
    });
  }

  const rows = await dbRes.json();
  if (!rows || rows.length === 0) {
    // PATCH succeeded (204) but no row returned — camera id may not exist
    return res.status(404).json({
      error: `Camera id ${id} not found in database`,
      url: publicUrl,
    });
  }

  return res.status(200).json({ url: publicUrl });
}
