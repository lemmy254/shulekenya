# ShuleKenya - Setup & Deployment Guide

This guide gets your site live on Netlify with a Supabase backend. No coding experience needed — just follow each step.

---

## Step 1: Create Your Supabase Backend (10 minutes)

Supabase is your free database, user auth, and photo storage.

1. Go to **https://supabase.com** and click **Start your project**
2. Sign up with your GitHub account (create one at github.com if needed)
3. Click **New Project**
   - Name: `shulekenya`
   - Database Password: choose something strong, save it somewhere
   - Region: pick the closest to Kenya (e.g., "West EU" or "East US")
4. Wait ~2 minutes for the project to set up

### Run the Database Schema

5. In your Supabase dashboard, click **SQL Editor** (left sidebar)
6. Click **New query**
7. Open the file `lib/schema.sql` from this project
8. Copy the ENTIRE contents and paste it into the SQL editor
9. Click **Run** — you should see "Success"

### Get Your API Keys

10. Go to **Settings** > **API** in Supabase
11. Copy these two values (you'll need them in Step 3):
    - **Project URL** (looks like `https://abc123.supabase.co`)
    - **anon public key** (a long string starting with `eyJ...`)

---

## Step 2: Push Code to GitHub (5 minutes)

1. Go to **https://github.com** and sign in
2. Click the **+** button > **New repository**
   - Name: `shulekenya`
   - Keep it **Public** or **Private** (your choice)
   - Click **Create repository**
3. Upload all the files from this `shulekenya` folder to the repository
   - Easiest way: click **uploading an existing file** link on the empty repo page
   - Drag and drop ALL the files/folders from the `shulekenya` directory
   - Click **Commit changes**

---

## Step 3: Deploy on Netlify (5 minutes)

1. Go to **https://app.netlify.com** and sign up with your GitHub account
2. Click **Add new site** > **Import an existing project**
3. Choose **GitHub** and select your `shulekenya` repository
4. Netlify will auto-detect the settings. Verify:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Click **Show advanced** > **New variable** and add:
   - Key: `NEXT_PUBLIC_SUPABASE_URL` → Value: your Supabase Project URL
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Value: your Supabase anon key
6. Click **Deploy site**
7. Wait 2-3 minutes for the build to finish

Your site is now live at `https://[random-name].netlify.app`!

---

## Step 4: Add Your Custom Domain (Optional)

1. Buy `shulekenya.co.ke` from a Kenyan registrar (e.g., Kenya Web Experts, Safaricom) — about KES 1,000/year
2. In Netlify: **Site settings** > **Domain management** > **Add custom domain**
3. Enter `shulekenya.co.ke`
4. Netlify will give you DNS settings — update these at your domain registrar
5. SSL certificate is automatic (free)

---

## Step 5: Seed Your First Schools (Do This!)

Your site is live but empty. To add the first schools:

### Option A: Register as a school
1. Go to your live site > **List Your School**
2. Create an account and add a school
3. Go to the dashboard, fill in all details, upload photos
4. Click **Publish School**

### Option B: Add schools directly in Supabase
1. Go to Supabase > **Table Editor** > **schools**
2. Click **Insert Row** and fill in the fields
3. Set `is_published` to `true`
4. Repeat for each school

### Option C: Bulk import (fastest)
1. Create a CSV or spreadsheet with school data
2. In Supabase > **Table Editor** > **schools** > click **Insert** > **Import CSV**
3. Map the columns and import

---

## How the Photo System Works

- Schools upload photos through their dashboard
- Photos are stored in Supabase Storage (1GB free)
- Cover photos appear on search cards and the school detail page header
- Gallery photos appear in the "Photos" section of the school page
- Photos are organized by user ID in the `school-photos` bucket

---

## Architecture Overview

```
Parents (browse, search, compare, review)
    ↓
Next.js Frontend (Netlify)
    ↓
Supabase Backend
├── Auth (school login/signup)
├── Database (PostgreSQL - schools, fees, reviews, enquiries)
└── Storage (school photos - 1GB free)
```

## Free Tier Limits (more than enough to start)

| Service   | Free Tier                    |
|-----------|------------------------------|
| Netlify   | 100GB bandwidth/month        |
| Supabase  | 500MB database               |
| Supabase  | 1GB file storage             |
| Supabase  | 50,000 monthly active users  |
| Supabase  | Unlimited API requests       |

---

## What to Do Next

1. **Seed 20-50 schools** to make the site feel alive
2. **Write blog content** (county guides, admission articles) for SEO
3. **Share on social media** and Kenyan parent Facebook groups
4. **Contact schools directly** — send them the registration link
5. **Set up Google Analytics** to track visitors
6. **Add Google AdSense** once you have traffic

---

## Need Help?

Come back to Claude/Cowork to:
- Generate SEO content for all 47 county pages
- Create outreach templates for contacting schools
- Build a pitch deck for schools
- Add new features (payment integration, comparison tool, etc.)
