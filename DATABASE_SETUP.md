# Database Setup Guide

## ✅ PostgreSQL Migration Complete

The application now uses **PostgreSQL** instead of SQLite for persistent, production-ready database storage.

## Quick Start

### Local Development

1. **Install PostgreSQL** (if not already installed):
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - **Mac**: `brew install postgresql@15`
   - **Linux**: `sudo apt-get install postgresql postgresql-contrib`

2. **Create Database**:
   ```bash
   # Start PostgreSQL service
   # Windows: PostgreSQL service should auto-start
   # Mac/Linux: brew services start postgresql@15 or sudo service postgresql start
   
   # Create database
   createdb finstock
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE finstock;
   \q
   ```

3. **Set Environment Variable**:
   Create `.env` file in project root:
   ```env
   # Format: postgresql://username:password@host:port/database
   # 
   # If your PostgreSQL has a password set (most common):
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/finstock
   
   # If no password (rare, uses peer authentication):
   DATABASE_URL=postgresql://postgres@localhost:5432/finstock
   
   # If using different username:
   DATABASE_URL=postgresql://yourusername:yourpassword@localhost:5432/finstock
   ```
   
   **Important**: Replace `yourpassword` with your actual PostgreSQL password!

4. **Start Backend**:
   ```bash
   npm run dev
   # OR
   cd backend && npm run dev
   ```

   The database tables will be **automatically created** on first run!

### Database Connection

The backend uses a connection pool to PostgreSQL:
- **Connection String**: Set via `DATABASE_URL` environment variable
- **Auto-initialization**: Tables are created automatically on first connection
- **Connection pooling**: Handles concurrent connections efficiently

## Database Schema

### Tables Created Automatically

1. **users** - User accounts
   - `id` (SERIAL PRIMARY KEY)
   - `email` (TEXT UNIQUE)
   - `password_hash` (TEXT)
   - `name` (TEXT)
   - `created_at` (TIMESTAMP)

2. **transactions** - Expense/revenue entries
   - `id` (SERIAL PRIMARY KEY)
   - `user_id` (TEXT)
   - `date` (TEXT)
   - `category` (TEXT)
   - `amount` (REAL)
   - `description` (TEXT)
   - `merchant` (TEXT)
   - `created_at` (TIMESTAMP)

3. **forecasts** - Stored forecast results
   - `id` (SERIAL PRIMARY KEY)
   - `user_id` (TEXT)
   - `forecast_date` (TEXT)
   - `dates` (TEXT) - JSON array
   - `balances` (TEXT) - JSON array
   - `method` (TEXT)
   - `created_at` (TIMESTAMP)

4. **anomalies** - Detected spending anomalies
   - `id` (SERIAL PRIMARY KEY)
   - `user_id` (TEXT)
   - `date` (TEXT)
   - `amount` (REAL)
   - `category` (TEXT)
   - `reason` (TEXT)
   - `severity` (TEXT)
   - `detected_at` (TIMESTAMP)

5. **sessions** - User sessions
   - `id` (SERIAL PRIMARY KEY)
   - `user_id` (INTEGER) - References users.id
   - `session_token` (TEXT UNIQUE)
   - `created_at` (TIMESTAMP)
   - `expires_at` (TIMESTAMP)

## Deployment on Render

### Automatic Setup with render.yaml

The `render.yaml` file is configured to:
1. **Create PostgreSQL database** automatically (free tier)
2. **Link database to backend** via `DATABASE_URL`
3. **Auto-initialize schema** on first deployment

### Manual Setup on Render

If deploying manually:

1. **Create PostgreSQL Database**:
   - Go to Render Dashboard
   - Click "New +" → "PostgreSQL"
   - Name: `finstock-database`
   - Plan: Free (or paid for production)

2. **Get Connection String**:
   - Copy "Internal Database URL" from database dashboard
   - Format: `postgresql://user:password@host:port/database`

3. **Set Environment Variable**:
   In your backend service on Render:
   - Add `DATABASE_URL` = your PostgreSQL connection string
   - Add other required env vars (see below)

## Environment Variables

### Required for PostgreSQL

```env
# PostgreSQL Connection
# Format: postgresql://username:password@host:port/database

# If your database has a password (REQUIRED in most cases):
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/finstock

# If no password (rare, uses peer authentication):
DATABASE_URL=postgresql://postgres@localhost:5432/finstock
```

**Important**: If you set a password during PostgreSQL installation, you MUST include it in the connection string!

### All Environment Variables

```env
# Backend
PORT=4000
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=postgresql://localhost:5432/finstock

# Python Services
PY_FORECAST_URL=http://localhost:5000
EXCEL_PARSER_URL=http://localhost:5001

# API Keys
GROK_API_KEY=your_grok_api_key_here
JWT_SECRET=your_jwt_secret_here

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Migration from SQLite to PostgreSQL

✅ **Already Complete!** The application has been fully migrated:
- ✅ `better-sqlite3` replaced with `pg` (PostgreSQL client)
- ✅ All queries converted from SQLite to PostgreSQL syntax
- ✅ Connection pooling implemented
- ✅ Auto-initialization on first run
- ✅ Transaction handling updated

### What Changed

1. **Database Module** (`backend/db.ts`):
   - Uses `pg.Pool` instead of `better-sqlite3.Database`
   - Connection pool for better performance
   - Auto-initializes schema on connect

2. **Queries** (`backend/server.ts`):
   - `db.prepare().get()` → `await db.query().then(r => r.rows[0])`
   - `db.prepare().all()` → `await db.query().then(r => r.rows)`
   - `db.prepare().run()` → `await db.query("INSERT ... RETURNING id")`
   - `?` placeholders → `$1, $2, $3` numbered placeholders
   - `db.transaction()` → `BEGIN/COMMIT/ROLLBACK` using client

3. **Dependencies** (`backend/package.json`):
   - Removed: `better-sqlite3`
   - Added: `pg`, `@types/pg`

## Testing the Database

### 1. Check Connection

Start backend and look for:
```
✅ Connected to PostgreSQL database
✅ Database tables initialized
```

### 2. Verify Tables

Connect to your database:
```bash
psql -U postgres -d finstock
```

List tables:
```sql
\dt
```

### 3. Test Endpoints

1. **Register user**: `POST /auth/register`
2. **Add transaction**: `POST /transactions`
3. **Get forecast**: `GET /forecast?userId=...`

## Troubleshooting

### Database Connection Failed

**Error**: `Connection refused` or `database does not exist`

**Solutions**:
1. Ensure PostgreSQL is running:
   ```bash
   # Check service status
   # Windows: Services → PostgreSQL
   # Mac: brew services list
   # Linux: sudo systemctl status postgresql
   ```

2. Verify `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL=postgresql://localhost:5432/finstock
   ```

3. Create database if missing:
   ```bash
   createdb finstock
   ```

### Permission Denied

**Error**: `permission denied for database`

**Solutions**:
1. Grant permissions:
   ```sql
   psql -U postgres
   GRANT ALL PRIVILEGES ON DATABASE finstock TO your_username;
   ```

2. Use postgres superuser (development only):
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/finstock
   ```

### Tables Not Created

**Error**: Tables don't exist

**Solutions**:
1. Check backend logs for initialization errors
2. Manually run initialization:
   ```bash
   # The backend auto-initializes on start
   # Check logs for "Database tables initialized"
   ```

3. Verify database connection in logs:
   ```
   ✅ Connected to PostgreSQL database
   ```

## Production Considerations

### Connection Pooling

The pool is configured with:
- **max**: 20 connections
- **idleTimeoutMillis**: 30000 (30 seconds)
- **connectionTimeoutMillis**: 2000 (2 seconds)

### SSL/TLS

For production deployments:
```typescript
ssl: { rejectUnauthorized: false }  // For Render, Cloud providers
```

### Backup Strategy

1. **Automatic Backups**: Render PostgreSQL free tier includes daily backups
2. **Manual Export**:
   ```bash
   pg_dump -U postgres finstock > backup.sql
   ```

3. **Restore**:
   ```bash
   psql -U postgres finstock < backup.sql
   ```

## Summary

✅ **PostgreSQL**: Production-ready database  
✅ **Auto-Initialization**: Tables created automatically  
✅ **Render Ready**: Configured in `render.yaml`  
✅ **Connection Pooling**: Efficient connection management  
✅ **Persistent Storage**: Data persists across restarts  

**To get started**: Install PostgreSQL, set `DATABASE_URL`, and start the backend!
