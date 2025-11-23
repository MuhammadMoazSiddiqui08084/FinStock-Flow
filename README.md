# FinStock Flow

> AI-Assisted Personal Finance Dashboard with Cashflow Forecasting

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)

**FinStock Flow** is a modern, AI-powered personal finance dashboard that helps you understand your cashflow trends, predict future balances, and get actionable financial recommendations.

## ✨ Features

- 📊 **Cashflow Forecasting** - Prophet-based ML forecasting with 14-day predictions
- 🤖 **AI Recommendations** - Personalized financial actions powered by Grok AI
- 📈 **Spending Analysis** - Visual breakdown by category with trends
- 📄 **File Upload** - Import transactions via CSV or Excel files
- 🔍 **Anomaly Detection** - Automatic identification of unusual spending patterns
- 💡 **What-If Simulator** - Test financial scenarios before committing
- 🔐 **User Authentication** - Secure login and data isolation
- 📱 **Modern UI** - Beautiful, responsive interface built with React & Tailwind

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://www.python.org/downloads/))
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd FinStock-Flow

# Install all dependencies (frontend, backend, Python)
npm run install:all

# Set up PostgreSQL database
createdb finstock

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys
```

### Environment Configuration

Create a `.env` file in the project root:

```env
# Backend
PORT=4000
HOST=0.0.0.0
NODE_ENV=development

# Database (PostgreSQL)
# Format: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/finstock

# Python Services
PY_FORECAST_URL=http://localhost:5000
EXCEL_PARSER_URL=http://localhost:5001

# API Keys (Optional - app works with mock data if not provided)
GROK_API_KEY=your_grok_api_key_here
JWT_SECRET=your_jwt_secret_here

# Frontend
FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:4000
```

### Run Development Server

```bash
# Start all services (frontend, backend, Python services)
npm run dev
```

This starts:
- **Frontend** on http://localhost:3000
- **Backend API** on http://localhost:4000
- **Python Prophet Service** on http://localhost:5000
- **Excel Parser Service** on http://localhost:5001

## 📖 Documentation

### Project Structure

```
FinStock-Flow/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── services/           # API service layer
│   └── utils/              # Utility functions
├── backend/                # Backend API (Node.js/Express)
│   ├── server.ts          # Main Express server
│   ├── db.ts              # PostgreSQL connection
│   └── py_forecast/       # Python services
│       ├── server.py      # Prophet forecasting service
│       └── excel_parser.py # Excel file parser
├── docs/                   # Additional documentation
└── .env                    # Environment variables
```

### API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

#### Transactions
- `GET /transactions` - Get all transactions
- `POST /transactions` - Add expense/revenue
- `POST /upload_csv` - Upload CSV file
- `POST /upload_excel` - Upload Excel file

#### Forecasting & Analysis
- `GET /forecast?userId=...&days=14` - Get cashflow forecast
- `GET /categories` - Get spending by category
- `GET /anomalies?userId=...` - Detect spending anomalies

#### AI Recommendations
- `POST /actions` - Generate AI recommendations
- `POST /simulate` - Simulate action impact
- `POST /explain_simulation` - Get AI explanation

### Database Schema

The application uses PostgreSQL with the following tables:
- `users` - User accounts
- `transactions` - Expense/revenue entries
- `forecasts` - Stored forecast results
- `anomalies` - Detected spending anomalies
- `sessions` - User sessions

See [docs/DATABASE.md](docs/DATABASE.md) for detailed schema information.

## 🔑 API Keys

### Grok API (Optional)

The app works with **mock AI data** if no Grok API key is provided. For real AI recommendations:

#### Getting a Grok API Key (Free Tier Available)

1. **Visit**: https://console.x.ai
2. **Sign up** for a free account (requires X/Twitter account)
3. Navigate to **"API Keys"** section
4. Click **"Create API Key"**
5. Copy the key (starts with `gsk_`)
6. Add to your `.env` file:
   ```env
   GROK_API_KEY=gsk_your_api_key_here
   ```

**Note**: 
- Grok API offers a **free tier** with limited requests
- The application gracefully falls back to mock data if:
  - No API key is provided
  - API key is invalid/expired
  - Rate limit is exceeded
- Mock data ensures all features work without API dependency

## 🛠️ Development

### Run Individual Services

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# Python Prophet service only
npm run dev:python

# Excel Parser service only
npm run dev:excel
```

### Build for Production

```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
```

## 🚢 Deployment

The project includes a `render.yaml` configuration for easy deployment on [Render.com](https://render.com):

1. Push code to GitHub
2. Connect repository to Render
3. Render will automatically:
   - Create PostgreSQL database
   - Deploy backend service
   - Deploy frontend service
   - Link services together

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## 🧪 Testing

```bash
# Test database connection
psql -U postgres -d finstock

# Test backend health
curl http://localhost:4000/health

# Test Python services
curl http://localhost:5000/health
curl http://localhost:5001/health
```

## 📝 How It Works

### Cashflow Forecasting

The app uses **Prophet** (Facebook's time-series forecasting library) to predict future cashflow:

1. Analyzes historical transaction data
2. Identifies trends and seasonality
3. Generates 14-day cashflow forecast
4. Falls back to moving average if Prophet unavailable

See [docs/AI_PREDICTION.md](docs/AI_PREDICTION.md) for detailed explanation.

### AI Recommendations

When you request recommendations:

1. App analyzes your forecast and spending categories
2. Sends data to Grok AI (or uses mock data)
3. Receives 3 ranked actionable recommendations
4. Each recommendation includes:
   - Impact (days gained)
   - Risk level
   - Specific changes to make

### Anomaly Detection

Uses statistical analysis (z-scores) to identify:
- Unusually high spending in categories
- Unusually low spending periods
- Transactions that deviate from normal patterns

## 🐛 Troubleshooting

### Database Connection Issues

**Error**: `password authentication failed`
- Ensure `DATABASE_URL` includes username and password
- Format: `postgresql://username:password@localhost:5432/finstock`

**Error**: `database does not exist`
- Create database: `createdb finstock`
- Or: `psql -U postgres` then `CREATE DATABASE finstock;`

### Python Services Not Starting

**Error**: `python: command not found`
- Ensure Python 3.9+ is installed
- Use `py` instead of `python` on Windows
- Install dependencies: `pip install -r backend/requirements.txt`

### Port Already in Use

Change ports in `.env`:
```env
PORT=4001        # Backend
VITE_PORT=3001   # Frontend
PY_PORT=5002     # Python
```

## 📚 Additional Documentation

- [Database Setup Guide](docs/DATABASE.md) - Detailed PostgreSQL setup
- [API Documentation](docs/API.md) - Complete API reference
- [AI Prediction Explanation](docs/AI_PREDICTION.md) - How forecasting works
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is available for development, academic use, and further customization.

## 🙏 Acknowledgments

- [Prophet](https://facebook.github.io/prophet/) - Time-series forecasting
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Motion](https://motion.dev/) - Animations
- [Vite](https://vitejs.dev/) - Build tool

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the [documentation](docs/)
- Review [troubleshooting guide](#-troubleshooting)

---

**Built with ❤️ for better financial management**
