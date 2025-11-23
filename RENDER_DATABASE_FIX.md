# 🔧 Render Database Connection Fix

## Problem
The backend is trying to connect to `localhost:5432` instead of Render's PostgreSQL database.

## Solution

### Step 1: Verify Database Service Exists
1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Check if `finstock-database` service exists
3. If it doesn't exist, the Blueprint might not have deployed it yet

### Step 2: Manual Database Setup (if needed)
If the database doesn't exist:
1. Click "New +" → "PostgreSQL"
2. Name: `finstock-database`
3. Database: `finstock`
4. User: `finstock_user`
5. Plan: Free
6. Create

### Step 3: Link Database to Backend
1. Go to `finstock-backend` service
2. Go to "Environment" tab
3. Check if `DATABASE_URL` exists
4. If not, add it:
   - Key: `DATABASE_URL`
   - Value: Click "Link Resource" → Select `finstock-database` → Property: `Internal Connection String` or `Connection String`
5. Save Changes
6. Manual Deploy (or wait for auto-deploy)

### Step 4: Verify Connection
After redeploying, check logs for:
- ✅ `DATABASE_URL: Found` (not "not found")
- ✅ Should show Render database host (not localhost)
- ✅ Should connect successfully

## Alternative: Use Internal Database URL
If you're using Blueprint deployment, the `fromDatabase` should automatically link it. If not working:
1. Go to `finstock-database` → "Connections"
2. Copy "Internal Database URL" 
3. Go to `finstock-backend` → Environment
4. Add `DATABASE_URL` with that value
5. Redeploy

