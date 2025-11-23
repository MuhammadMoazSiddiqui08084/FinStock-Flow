# 🚀 Render Deployment Guide

## Quick Deploy Steps

1. **Connect Repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and deploy all services

2. **Environment Variables**
   - After deployment, go to each service's settings
   - Add `GROK_API_KEY` to the `finstock-backend` service:
     - Go to `finstock-backend` → Environment
     - Add variable: `GROK_API_KEY` = `your_actual_grok_api_key_here`
     - Click "Save Changes"

3. **Services Deployed**
   - ✅ `finstock-database` - PostgreSQL database
   - ✅ `finstock-python` - Prophet forecasting service
   - ✅ `finstock-excel-parser` - Excel file parser service
   - ✅ `finstock-backend` - Node.js API backend
   - ✅ `finstock-frontend` - Static React frontend

## What Was Fixed

✅ **All services now bind to `0.0.0.0`** (required by Render)  
✅ **Python services use `PORT` from Render** (not hardcoded)  
✅ **Frontend builds as static site** (not dev server)  
✅ **Excel parser service added** to deployment  
✅ **Service URLs automatically configured** via Render service references  

## Service URLs

After deployment, update these in your Render dashboard if needed:
- Frontend will be at: `https://finstock-frontend.onrender.com`
- Backend will be at: `https://finstock-backend.onrender.com`
- Python Prophet: Auto-configured via `PY_FORECAST_URL`
- Excel Parser: Auto-configured via `EXCEL_PARSER_URL`

## Troubleshooting

If deployment fails:
1. Check build logs in Render dashboard
2. Ensure `GROK_API_KEY` is set (backend will use mock data if not)
3. Verify all services show "Live" status
4. Check that database connection is working (look for connection logs in backend)

## Free Tier Notes

⚠️ **Free instances spin down after inactivity** - first request after spin-down takes ~50 seconds  
💡 **Consider upgrading** if you need always-on instances

