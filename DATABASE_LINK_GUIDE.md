# 🔗 How to Link Database in Render

## Problem
Your backend is still connecting to `localhost:5432` instead of Render's PostgreSQL database.

## Solution - Link Database Manually

### Step 1: Go to Backend Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on `finstock-backend` service

### Step 2: Go to Environment Tab
1. Click on "Environment" tab in the left sidebar
2. Scroll to find `DATABASE_URL` variable

### Step 3: Link Database
1. If `DATABASE_URL` exists but points to `localhost`:
   - Click on `DATABASE_URL`
   - Click "Remove" or delete the value
   
2. Click "Add Environment Variable" button

3. Fill in:
   - **Key**: `DATABASE_URL`
   - **Value**: Click "Link Resource" dropdown
     - Select: `finstock-database`
     - Property: Choose "Internal Database URL" (this is the connection string)
   - OR manually paste the Internal Database URL from `finstock-database` service → Connections tab

### Step 4: Save and Redeploy
1. Click "Save Changes"
2. Render will automatically redeploy (or click "Manual Deploy" → "Clear build cache & deploy")

### Step 5: Verify
After redeploy, check logs. You should see:
- ✅ Database host should be `dpg-d4hk6fvdi...` (NOT localhost)
- ✅ Connection successful

## Why This Happens
The `fromDatabase` in `render.yaml` should auto-link, but sometimes you need to manually link it the first time, especially if services were created separately.

