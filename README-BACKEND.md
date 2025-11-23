# FinStock Flow - Backend Service

This is the standalone backend service for FinStock Flow, an AI-assisted personal finance dashboard.

## Architecture

- **Node.js/Express** - Main API server (TypeScript)
- **PostgreSQL** - Database (pg - connection pooling)
- **Python/FastAPI** - Prophet forecasting service
- **Grok API** - LLM for action generation and explanations

## Features

### Endpoints

- `POST /upload_csv` - Upload and parse CSV transaction files
- `GET /forecast?userId=...&days=14` - Generate 14-day cashflow forecast using Prophet
- `POST /actions` - Generate 3 ranked financial actions using Grok AI
- `POST /simulate` - Simulate the impact of an action on forecast
- `POST /explain_simulation` - Generate AI explanation for simulation results
- `GET /anomalies?userId=...` - Detect spending anomalies using statistical analysis
- `GET /health` - Health check endpoint

### Database Schema

- `transactions` - User transaction history
- `forecasts` - Stored forecast results
- `anomalies` - Detected spending anomalies
- `sessions` - User session management

## Setup

### Prerequisites

- Node.js 18+ 
- Python 3.9+
- npm

### Installation

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install Python dependencies:**
   ```bash
   cd py_forecast
   pip install -r ../requirements.txt
   ```

3. **Install PostgreSQL** (if not installed):
   ```bash
   # Windows: Download from postgresql.org
   # Mac: brew install postgresql@15
   # Linux: sudo apt-get install postgresql postgresql-contrib
   ```

4. **Create PostgreSQL database:**
   ```bash
   createdb finstock
   # Or using psql:
   psql -U postgres
   CREATE DATABASE finstock;
   \q
   ```

5. **Create `.env` file in root:**
   ```env
   PORT=4000
   HOST=0.0.0.0
   DATABASE_URL=postgresql://localhost:5432/finstock
   PY_FORECAST_URL=http://localhost:5000
   EXCEL_PARSER_URL=http://localhost:5001
   GROK_API_KEY=your_grok_api_key_here
   JWT_SECRET=your_jwt_secret_here
   FRONTEND_URL=http://localhost:3000
   ```

### Running

**Development (from root):**
```bash
npm run dev
```

This will start:
- Frontend (Vite) on `http://localhost:3000`
- Backend (Node) on `http://localhost:4000`
- Python Prophet service on `http://localhost:5000`

**Backend only:**
```bash
cd backend
npm run dev
```

**Production:**
```bash
cd backend
npm run build
npm start
```

## Prophet Forecasting

The Prophet service runs as a separate FastAPI application. It must be running for advanced forecasting to work. If unavailable, the backend falls back to a simple moving average forecast.

### Starting Prophet service:

```bash
cd backend/py_forecast
python server.py
```

Or use uvicorn directly:
```bash
cd backend/py_forecast
uvicorn server:app --host 0.0.0.0 --port 5000
```

## Grok API Integration

The backend uses Grok API (x.ai) for:
- Generating financial action recommendations
- Explaining simulation results

Set `GROK_API_KEY` in your `.env` file. If not set, the API will return mock data for development.

**Note:** Grok API endpoint: `https://api.x.ai/v1/chat/completions`

## Database

PostgreSQL database connection is configured via `DATABASE_URL` environment variable.

The database is automatically initialized on first run with all required tables. Tables are created automatically when the backend starts.

**Connection String Format**:
```
postgresql://username:password@host:port/database
```

**Default Local**: `postgresql://localhost:5432/finstock`

## Development

### Project Structure

```
backend/
├── server.ts          # Main Express server
├── main.ts            # Forecast utilities
├── db.ts              # Database setup
├── package.json       # Backend dependencies
├── tsconfig.json      # TypeScript config
└── py_forecast/
    ├── server.py      # FastAPI Prophet service
    ├── requirements.txt
    └── __init__.py
```

### Adding New Endpoints

1. Add route in `server.ts`
2. Add types/interfaces as needed
3. Update this README

## Deployment (Render)

The `render.yaml` file contains configuration for deploying to Render.com:

1. Backend service (Node.js)
2. Python service (Prophet)
3. Frontend service (Static)

Set environment variables in Render dashboard:
- `GROK_API_KEY`
- `PY_FORECAST_URL` (auto-configured via service linking)

## API Documentation

### POST /upload_csv

Upload CSV file with columns: `date`, `category`, `amount`, `description`, `merchant`

**Request:**
- `file`: CSV file (multipart/form-data)
- `userId`: Optional user ID (default: "anon")

**Response:**
```json
{
  "success": true,
  "parsed": [...],
  "count": 150
}
```

### GET /forecast

Generate cashflow forecast.

**Query Params:**
- `userId`: User ID (default: "anon")
- `days`: Forecast days (default: 14)

**Response:**
```json
{
  "dates": ["2024-01-15", ...],
  "balances": [1234.56, ...]
}
```

### POST /actions

Generate 3 ranked financial actions.

**Request:**
```json
{
  "forecast": { "dates": [...], "balances": [...] },
  "categories": [{ "name": "Food", "amount": 500 }],
  "userId": "user123"
}
```

**Response:**
```json
{
  "actions": [
    {
      "id": "a1",
      "title": "Reduce Food by 20%",
      "change": { "category": "Food & Dining", "pct": 20 },
      "buffer_gain_days": 6,
      "risk": "low",
      "explanation": "Reduce dining out frequency"
    },
    ...
  ]
}
```

### POST /simulate

Simulate action impact on forecast.

**Request:**
```json
{
  "userId": "user123",
  "action": {
    "title": "Reduce Food by 20%",
    "change": { "category": "Food & Dining", "pct": 20 }
  }
}
```

**Response:**
```json
{
  "before": { "dates": [...], "balances": [...] },
  "after": { "dates": [...], "balances": [...] },
  "metrics": {
    "before_first_negative_day": 8,
    "after_first_negative_day": 12,
    "improvement_days": 4,
    "delta_balance": 123.45
  },
  "explanation": "This action would delay negative balance by 4 days..."
}
```

### GET /anomalies

Detect spending anomalies.

**Query Params:**
- `userId`: User ID

**Response:**
```json
{
  "anomalies": [
    {
      "date": "2024-01-10",
      "category": "Shopping",
      "amount": 450.00,
      "reason": "Unusually high spending (2.5σ above average)",
      "severity": "medium"
    }
  ]
}
```

## Troubleshooting

**Python service not starting:**
- Check Python version: `python --version` (should be 3.9+)
- Install dependencies: `pip install -r backend/requirements.txt`
- Check port 5000 is available

**Database errors:**
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` env var is correct
- Check database exists: `psql -U postgres -l` (should see `finstock`)
- Ensure user has permissions: `GRANT ALL ON DATABASE finstock TO your_user;`

**Grok API errors:**
- Verify API key is set in `.env`
- Check API key is valid
- Mock data will be returned if API unavailable

## License

See main README.md

