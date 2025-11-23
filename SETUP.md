# FinStock Flow - Setup Guide

This guide will help you set up the complete FinStock Flow application for development.

## Quick Start

```bash
# 1. Install all dependencies
npm run install:all

# 2. Create .env file (see below)

# 3. Start all services
npm run dev
```

This will start:
- **Frontend** (Vite) on http://localhost:3000
- **Backend** (Node.js/Express) on http://localhost:4000
- **Python Prophet Service** on http://localhost:5000

## Detailed Setup

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://www.python.org/downloads/))
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))
- **npm** (comes with Node.js)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd FinStock-Flow

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install Python dependencies
cd py_forecast
pip install -r ../requirements.txt
cd ../..
```

Or use the convenient script:
```bash
npm run install:all
```

### Step 2: Database Setup

1. **Install PostgreSQL** (if not installed):
   - **Windows**: Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
   - **Mac**: `brew install postgresql@15`
   - **Linux**: `sudo apt-get install postgresql postgresql-contrib`

2. **Create Database**:
   ```bash
   # Create database
   createdb finstock
   
   # Or using psql:
   psql -U postgres
   CREATE DATABASE finstock;
   \q
   ```

3. **Start PostgreSQL** (if not running):
   - **Windows**: Service should auto-start
   - **Mac**: `brew services start postgresql@15`
   - **Linux**: `sudo systemctl start postgresql`

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```env
# Backend Configuration
PORT=4000
HOST=0.0.0.0
DATABASE_URL=postgresql://localhost:5432/finstock

# Python Prophet Service
PY_PORT=5000
PY_HOST=0.0.0.0
PY_FORECAST_URL=http://localhost:5000
EXCEL_PARSER_URL=http://localhost:5001

# API Keys
GROK_API_KEY=your_grok_api_key_here
JWT_SECRET=your_jwt_secret_here

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:4000
```

**Note:** 
- If you don't have a Grok API key, the backend will use mock data for development.
- Get your Grok API key from [x.ai](https://x.ai)
- Update `DATABASE_URL` if using different PostgreSQL credentials

**Note:** 
- If you don't have a Grok API key, the backend will use mock data for development.
- Get your Grok API key from [x.ai](https://x.ai)

### Step 4: Create Required Directories

The application will create these automatically, but you can create them manually:

```bash
mkdir -p tmp
```

### Step 5: Start Development

#### Option 1: Start Everything Together (Recommended)

```bash
npm run dev
```

This starts all three services concurrently.

#### Option 2: Start Services Individually

**Terminal 1 - Frontend:**
```bash
npm run dev:frontend
```

**Terminal 2 - Backend:**
```bash
npm run dev:backend
```

**Terminal 3 - Python Prophet:**
```bash
npm run dev:python
```

Or manually:
```bash
cd backend/py_forecast
python server.py
# or
python3 server.py
```

### Step 6: Verify Setup

1. **Frontend**: Open http://localhost:3000
2. **Backend Health**: http://localhost:4000/health
3. **Python Health**: http://localhost:5000/health

You should see:
- Frontend: React dashboard
- Backend: `{"status":"ok","timestamp":"..."}`
- Python: `{"status":"ok"}`

## Project Structure

```
FinStock-Flow/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   └── ...
├── backend/                # Backend API
│   ├── server.ts          # Main Express server
│   ├── main.ts            # Forecast utilities
│   ├── db.ts              # Database setup
│   ├── py_forecast/       # Python Prophet service
│   │   ├── server.py      # FastAPI service
│   │   └── requirements.txt
│   └── package.json
├── tmp/                    # Temporary uploads (auto-created)
├── package.json           # Root package.json
├── vite.config.ts         # Vite configuration
└── .env                   # Environment variables (create this)
```

## API Endpoints

Once running, the backend exposes these endpoints:

- `GET /health` - Health check
- `POST /upload_csv` - Upload CSV transactions
- `GET /forecast?userId=...&days=14` - Get forecast
- `POST /actions` - Generate AI actions
- `POST /simulate` - Simulate action impact
- `POST /explain_simulation` - Get AI explanation
- `GET /anomalies?userId=...` - Detect anomalies

See `README-BACKEND.md` for detailed API documentation.

## Troubleshooting

### Python Service Won't Start

**Error:** `python: command not found`

**Solution:**
- Ensure Python 3.9+ is installed
- Use `python3` instead of `python` on some systems
- Update the `dev:python` script in `package.json` if needed

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
cd backend/py_forecast
pip install -r ../requirements.txt
```

### Database Errors

**Error:** `Connection refused` or `database "finstock" does not exist`

**Solution:**
- Ensure PostgreSQL is running:
  - **Windows**: Check Services → PostgreSQL
  - **Mac**: `brew services list` (should see postgresql running)
  - **Linux**: `sudo systemctl status postgresql`
- Create database: `createdb finstock`
- Verify `DATABASE_URL` in `.env`: `postgresql://localhost:5432/finstock`

**Error:** `password authentication failed`

**Solution:**
- Update `DATABASE_URL` with correct credentials:
  ```
  DATABASE_URL=postgresql://username:password@localhost:5432/finstock
  ```
- Or use postgres user: `DATABASE_URL=postgresql://postgres:password@localhost:5432/finstock`

**Error:** `permission denied for database`

**Solution:**
```sql
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE finstock TO your_username;
\q
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
- Change ports in `.env`
- Or kill the process using the port:
  ```bash
  # Find process
  lsof -i :4000
  # Kill it
  kill -9 <PID>
  ```

### Grok API Errors

**Error:** `Grok API error: 401`

**Solution:**
- Verify your API key in `.env`
- Get a new key from https://x.ai
- Mock data will be used if API unavailable

### Frontend Can't Connect to Backend

**Error:** `Failed to fetch`

**Solution:**
- Ensure backend is running on port 4000
- Check `VITE_API_URL` in `.env`
- Check CORS settings in `backend/server.ts`
- Verify proxy in `vite.config.ts`

## Development Tips

1. **Hot Reload**: All services support hot reload
   - Frontend: Vite HMR
   - Backend: tsx watch mode
   - Python: Manual restart (or use `watchdog`)

2. **Database**: PostgreSQL database `finstock`
   - Tables are auto-created on first run
   - Reset database: `dropdb finstock && createdb finstock`
   - Back up: `pg_dump -U postgres finstock > backup.sql`

3. **Mock Mode**: Set `MOCK_LLM=true` in `.env` to use mock AI responses

4. **Logs**: Check console output for all services
   - Each service logs to its terminal
   - Use `concurrently` labels to identify sources

## Building for Production

```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
```

See `render.yaml` for Render.com deployment configuration.

## Next Steps

- Read `README-BACKEND.md` for backend details
- Check component documentation in `src/components/`
- Review API endpoints in `backend/server.ts`
- Test with sample CSV files

## Need Help?

- Check `README-BACKEND.md` for API documentation
- Review error logs in console
- Ensure all services are running
- Verify `.env` configuration

