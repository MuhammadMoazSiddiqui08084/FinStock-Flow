# PostgreSQL Connection String Guide

## Current Issue

Your `.env` file currently has:
```env
DATABASE_URL=postgresql://localhost:5432/finStock
```

This is missing the **username** and **password**, which are required if your PostgreSQL has authentication enabled (which is the default).

## Fix: Update Your `.env` File

### Step 1: Find Your PostgreSQL Credentials

**Option A: Check what you set during installation**
- During PostgreSQL installation on Windows, you would have set a password for the `postgres` superuser
- This is the password you need

**Option B: Test your connection**
```bash
# Try connecting with psql to see what works
psql -U postgres -d finStock
# If it asks for a password, you have one set
```

### Step 2: Update `.env` File

Open your `.env` file in the project root and update the `DATABASE_URL` line:

**If your PostgreSQL username is `postgres`** (most common):
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/finStock
```

**If you're using a different username:**
```env
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/finStock
```

**Example:**
```env
DATABASE_URL=postgresql://postgres:mypassword123@localhost:5432/finStock
```

### Step 3: Verify Connection

After updating `.env`, test the connection:

```bash
# Start your backend
npm run dev

# You should see:
# ✅ Connected to PostgreSQL database
# ✅ Database tables initialized
```

## Connection String Format

```
postgresql://[username]:[password]@[host]:[port]/[database]
```

**Components:**
- `username`: Your PostgreSQL username (usually `postgres`)
- `password`: Your PostgreSQL password (the one you set during installation)
- `host`: `localhost` (for local development)
- `port`: `5432` (default PostgreSQL port)
- `database`: `finStock` (your database name)

## Common Issues

### "password authentication failed"
- Your password is incorrect
- Double-check the password you set during PostgreSQL installation
- Try resetting it: [PostgreSQL Password Reset Guide](https://www.postgresql.org/docs/current/auth-methods.html)

### "database does not exist"
- Your database name in the connection string doesn't match
- You have `finStock` (capital S), make sure that matches exactly
- Create it if missing: `createdb finStock`

### "connection refused"
- PostgreSQL service is not running
- **Windows**: Check Services → PostgreSQL
- **Mac**: `brew services list`
- **Linux**: `sudo systemctl status postgresql`

## Security Note

⚠️ **Never commit your `.env` file to git!** 
- It contains sensitive credentials
- `.gitignore` should already exclude it
- Use `.env.example` as a template (without real passwords)

## Quick Test

After updating your `.env` file, you can test the connection directly:

```bash
# Using psql (if installed)
psql "postgresql://postgres:YOUR_PASSWORD@localhost:5432/finStock"

# Or test from your app
node -e "require('pg').Pool({connectionString: 'postgresql://postgres:YOUR_PASSWORD@localhost:5432/finStock'}).connect().then(() => console.log('✅ Connected!')).catch(e => console.error('❌ Error:', e.message))"
```

## Summary

1. ✅ Find your PostgreSQL password (the one you set during installation)
2. ✅ Update `.env` file:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/finStock
   ```
3. ✅ Replace `YOUR_PASSWORD` with your actual password
4. ✅ Save the file
5. ✅ Start backend: `npm run dev`
6. ✅ Look for: `✅ Connected to PostgreSQL database`

You're all set! 🎉

