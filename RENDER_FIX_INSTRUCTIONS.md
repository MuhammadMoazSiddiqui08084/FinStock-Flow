# 🔧 Fix Render Deployment - Current Issues

## Problem
Render is running `npm run dev` which starts ALL services together instead of separate services.

## Root Cause
The service is probably auto-detecting from `package.json` instead of using `render.yaml` Blueprint.

## Solution

### Option 1: Delete and Recreate Using Blueprint (RECOMMENDED)

1. **Delete current services in Render:**
   - Go to Render Dashboard
   - Delete `finstock-t8q0` service (or whatever the current service is)

2. **Deploy using Blueprint:**
   - Click "New +" → "Blueprint"
   - Connect your GitHub repo: `MuhammadMoazSiddiqui08084/FinStock-Flow`
   - Render will detect `render.yaml` automatically
   - Click "Apply" to create all 5 services separately:
     - ✅ `finstock-database` (PostgreSQL)
     - ✅ `finstock-backend` (Node.js API)
     - ✅ `finstock-frontend` (Static Site)
     - ✅ `finstock-python` (Prophet service)
     - ✅ `finstock-excel-parser` (Excel parser)

3. **After deployment:**
   - Go to `finstock-backend` → Environment
   - Add `GROK_API_KEY` manually (if not synced)

### Option 2: Fix Current Service Manually

If you want to keep the current service:

1. **Go to the service settings:**
   - Click on the service (probably `finstock-t8q0` or similar)

2. **Update Build Command:**
   - Build Command: `cd backend && npm install && npm run build`

3. **Update Start Command:**
   - Start Command: `cd backend && node dist/server.js`

4. **Set Environment Variables:**
   - `NODE_ENV` = `production`
   - `HOST` = `0.0.0.0`
   - `DATABASE_URL` = Link to `finstock-database` → "Internal Database URL"
   - `GROK_API_KEY` = Your API key
   - `FRONTEND_URL` = Your frontend URL

5. **Save and Redeploy:**
   - Click "Manual Deploy" → "Clear build cache & deploy"

## After Fix

### Access Points:
- **Frontend:** `https://finstock-frontend.onrender.com` (if using Blueprint)
- **Backend API:** `https://finstock-backend.onrender.com` (if using Blueprint)
- **Root route:** Backend now serves JSON at `/` with service info

### Test:
- Backend: `https://finstock-backend.onrender.com/` should return JSON
- Health: `https://finstock-backend.onrender.com/health` should return `{"status":"ok"}`

