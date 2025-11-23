# Deployment Guide

Deploy FinStock Flow to production using Render.com.

## Render.com Deployment

The project includes `render.yaml` for automatic deployment:

1. **Push to GitHub**: Ensure your code is in a GitHub repository

2. **Connect to Render**:
   - Sign up at [render.com](https://render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml` automatically

3. **Automatic Setup**:
   - PostgreSQL database created automatically
   - Backend service deployed
   - Frontend service deployed
   - Services linked via environment variables

4. **Set Environment Variables**:
   - `GROK_API_KEY` (optional)
   - `JWT_SECRET` (auto-generated)
   - `DATABASE_URL` (auto-linked from PostgreSQL service)

## Manual Deployment

### Backend
- Build command: `cd backend && npm install && npm run build`
- Start command: `cd backend && npm start`
- Environment: Node.js

### Frontend
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment: Static Site

### Python Services
Deploy separately or run on the same instance as backend.

For detailed deployment instructions, refer to the main [README.md](../README.md).

