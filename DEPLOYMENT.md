# Deployment Guide

This guide covers deploying the Omnipixel scanner to platforms that support Puppeteer.

## Option 1: Railway (Recommended)

Railway is the easiest option and works great with Puppeteer.

### Steps:

1. **Sign up at [railway.app](https://railway.app)** (free tier available)

2. **Create a new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select this repository

3. **Configure environment variables:**
   - Go to your project → Variables
   - Add your `.env` variables:
     - `PAGESPEED_API_KEY`
     - `TAGSTACK_API_KEY`
     - `NODE_ENV=production`

4. **Railway will auto-detect Dockerfile:**
   - Railway will use the `Dockerfile` automatically
   - If you prefer the simpler version, rename `Dockerfile.simple` to `Dockerfile`

5. **Deploy:**
   - Railway will automatically deploy on every push to master
   - Check the "Deployments" tab for logs

### Railway-specific settings:
- **Port:** Railway automatically sets `PORT` environment variable (Next.js will use it)
- **Build:** Railway runs `npm run build` automatically
- **Start:** Railway runs `npm start` automatically

---

## Option 2: Render

Render is another great option with a free tier.

### Steps:

1. **Sign up at [render.com](https://render.com)** (free tier available)

2. **Create a new Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure settings:**
   - **Name:** `omnipixel-scanner` (or your choice)
   - **Environment:** `Docker`
   - **Region:** Choose closest to you
   - **Branch:** `master`
   - **Root Directory:** Leave empty (or `./`)

4. **Add environment variables:**
   - Go to "Environment" tab
   - Add:
     - `PAGESPEED_API_KEY`
     - `TAGSTACK_API_KEY`
     - `NODE_ENV=production`

5. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy automatically

### Render-specific settings:
- **Build Command:** (auto-detected from Dockerfile)
- **Start Command:** (auto-detected from Dockerfile)
- **Health Check Path:** `/api/health` (optional - you may want to create this)

---

## Option 3: Fly.io

Fly.io offers global edge deployment.

### Steps:

1. **Install Fly CLI:**
   ```bash
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Sign up:** `fly auth signup`

3. **Initialize Fly app:**
   ```bash
   fly launch
   ```
   - Follow prompts
   - Don't deploy yet

4. **Create `fly.toml`:**
   ```toml
   app = "your-app-name"
   primary_region = "iad"

   [build]
     dockerfile = "Dockerfile"

   [http_service]
     internal_port = 3000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
     processes = ["app"]

   [[vm]]
     cpu_kind = "shared"
     cpus = 1
     memory_mb = 1024
   ```

5. **Set secrets:**
   ```bash
   fly secrets set PAGESPEED_API_KEY=your_key
   fly secrets set TAGSTACK_API_KEY=your_key
   fly secrets set NODE_ENV=production
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

---

## Option 4: DigitalOcean App Platform

### Steps:

1. **Sign up at [digitalocean.com](https://digitalocean.com)**

2. **Create App:**
   - Go to "Apps" → "Create App"
   - Connect GitHub repository

3. **Configure:**
   - **Type:** Web Service
   - **Build Command:** `npm run build`
   - **Run Command:** `npm start`
   - **Environment:** Docker (select Dockerfile)

4. **Add environment variables** (same as above)

5. **Deploy**

---

## Dockerfile Options

### Option A: System Chromium (Recommended for production)
Uses the main `Dockerfile` - smaller image, faster startup

### Option B: Puppeteer's Chromium (Easier setup)
Rename `Dockerfile.simple` to `Dockerfile` - larger image but simpler

---

## Troubleshooting

### Puppeteer not finding Chromium:
- Make sure `PUPPETEER_EXECUTABLE_PATH` is set correctly
- Check that Chromium is installed in the Docker image

### Memory issues:
- Increase memory allocation in platform settings
- Puppeteer needs at least 512MB RAM

### Timeout issues:
- Increase function timeout in platform settings
- Scanner can take 30-60 seconds per scan

---

## Cost Comparison

- **Railway:** Free tier (500 hours/month), then $5/month
- **Render:** Free tier (750 hours/month), then $7/month
- **Fly.io:** Free tier (3 VMs), then pay-as-you-go
- **DigitalOcean:** $5/month minimum

---

## Recommendation

**Start with Railway** - it's the easiest to set up and has good Puppeteer support.
