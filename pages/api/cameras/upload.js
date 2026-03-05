export const config = {
  api: { bodyParser: { sizeLimit: '12mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // id comes from the request body, not query (this is a static route)
  const { id, photoData, mimeType, photoType } = req.body;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Missing camera id' });
  }

  try {
    const buffer = Buffer.from(photoData, 'base64');
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    const fileName = `${id}/${photoType}-${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/camera-photos/${fileName}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': mimeType || 'image/jpeg',
          'x-upsert': 'true',
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.status(500).json({ error: 'Upload failed: ' + err });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/camera-photos/${fileName}`;

    // Update the camera row with the new photo URL
    const dbField = photoType === 'install' ? 'photo_install_url' : 'screenshot_view_url';
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/cameras?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ [dbField]: publicUrl }),
    });

    if (!dbRes.ok) {
      const err = await dbRes.text();
      return res.status(500).json({ error: 'DB update failed: ' + err });
    }

    return res.status(200).json({ url: publicUrl });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
