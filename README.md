# Verkada Deployment Tracker v2 — Setup Guide

## What's New in This Version
- ✅ Photo uploads for install photos and camera view screenshots
- ✅ Customer can click any camera on the dashboard to view its photos
- ✅ Password protection — separate passwords for you and your customer
- ✅ Real database backend via Supabase
- ✅ Hosted on Vercel (free)

## Your URLs When Done
- **Tracker (you):** `https://your-app.vercel.app/`  → login with TRACKER_PASSWORD
- **Dashboard (customer):** `https://your-app.vercel.app/dashboard`  → login with DASHBOARD_PASSWORD

---

## STEP 1 — Set Up Your Database (Supabase)

1. Go to **https://supabase.com** → Sign up (free)
2. Click **"New project"**, name it `verkada-tracker`, pick a region, click **"Create"**
3. Wait ~2 minutes for it to spin up
4. In the left sidebar → **"SQL Editor"** → **"New query"**
5. Paste this SQL and click **"Run"**:

```sql
create table cameras (
  id uuid primary key default gen_random_uuid(),
  name text default '',
  floor text default '',
  model text default '',
  ip text default '',
  switch_name text default '',
  switch_port text default '',
  photo_install_url text default '',
  screenshot_view_url text default '',
  notes text default '',
  serial_number text default '',
  created_at timestamptz default now()
);
```

6. You should see **"Success. No rows returned"**

---

## STEP 1b — If You Already Have the App Deployed (Existing Users Only)

Run this SQL in Supabase to add the new serial number column:

```sql
alter table cameras add column if not exists serial_number text default '';
```

---

## STEP 2 — Set Up Photo Storage (Supabase Storage)

1. In the left sidebar → **"Storage"**
2. Click **"New bucket"**
   - Name: `camera-photos`
   - Toggle **"Public bucket"** to ON
   - Click **"Save"**

That's it — photos will now be stored here and served via public URL.

---

## STEP 3 — Get Your Supabase Credentials

1. Left sidebar → **"Project Settings"** (gear icon) → **"API"**
2. Copy and save:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **service_role** secret key (click the eye icon to reveal)

---

## STEP 4 — Put the Project on GitHub

1. Go to **https://github.com** → create a free account
2. Click **"+"** → **"New repository"** → name it `verkada-tracker` → **"Create repository"**
3. Click **"uploading an existing file"**
4. Unzip the folder you downloaded and drag ALL files/folders into the upload area
   - Make sure `middleware.js`, `package.json`, `next.config.js` and the entire `pages/` folder are included
5. Click **"Commit changes"**

---

## STEP 5 — Deploy to Vercel

1. Go to **https://vercel.com** → **"Sign Up"** → **"Continue with GitHub"**
2. Click **"Add New…"** → **"Project"** → Import **"verkada-tracker"**
3. Before clicking Deploy, find **"Environment Variables"** and add ALL FOUR:

   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | your Project URL from Step 3 |
   | `SUPABASE_SERVICE_KEY` | your service_role key from Step 3 |
   | `TRACKER_PASSWORD` | choose a strong password for yourself |
   | `DASHBOARD_PASSWORD` | choose a password to share with your customer |

   Click **"Add"** after each one.

4. Click **"Deploy"** and wait ~2 minutes

---

## STEP 6 — Share With Your Customer

- Give your customer the **dashboard URL** and the **DASHBOARD_PASSWORD**
- They log in, see live progress, and can click any camera to view photos
- Sessions last 8 hours — they'll need to log in again after that

---

## Troubleshooting

**Photos not uploading:**
- Make sure you created the `camera-photos` bucket in Step 2
- Make sure it is set to **Public**
- Check that `SUPABASE_SERVICE_KEY` is the **service_role** key, not the `anon` key

**"Invalid password" on login:**
- In Vercel → your project → Settings → Environment Variables
- Verify `TRACKER_PASSWORD` and `DASHBOARD_PASSWORD` are set correctly
- After changing env vars: Deployments → three dots on latest → Redeploy

**Blank screen or "Failed to fetch":**
- Verify `SUPABASE_URL` has no trailing slash
- Verify the `cameras` table was created (re-run the SQL in Step 1)

**Want to change passwords later:**
- Vercel → Project → Settings → Environment Variables → edit the value
- Then Deployments → Redeploy

---

## Your Details (fill in after deploying)

- Tracker URL: ___________________________
- Dashboard URL: ___________________________
- Customer password: ___________________________
