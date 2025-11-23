# 🔧 Quick Fix for Backend Deployment Failure

## Step 1: Check the Error Logs

1. Go to Render Dashboard
2. Click on `finstock-backend-eo45` service
3. Click "Logs" tab
4. Scroll to find the error message

## Common Errors & Fixes:

### Error 1: "Cannot find module" or "dist/server.js not found"
**Fix:** Build might have failed. Check if TypeScript compiled successfully.

### Error 2: "DATABASE_URL is required in production"
**Fix:** Database isn't linked yet. After Blueprint deploys, manually link the database:
- Go to `finstock-backend-eo45` → Environment
- Link `DATABASE_URL` to `finstock-database-eo45`

### Error 3: Port timeout / No open ports
**Fix:** Should be fine, but verify backend binds to `0.0.0.0`

### Error 4: Build failed / TypeScript errors
**Fix:** Check build logs for TypeScript compilation errors

## Quick Manual Fix:

If the service was created but deploy failed:

1. **Go to service settings**
2. **Verify:**
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && node dist/server.js`
3. **Manual Deploy:**
   - Click "Manual Deploy" → "Clear build cache & deploy"

## Share the Error:
Copy the error message from logs and I'll help fix it!

