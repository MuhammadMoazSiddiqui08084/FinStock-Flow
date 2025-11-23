from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pandas as pd
from prophet import Prophet
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Point(BaseModel):
    date: str
    value: float

class PredictRequest(BaseModel):
    series: List[Point]
    days: int = 14

class PredictResponse(BaseModel):
    dates: List[str]
    balances: List[float]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        if not req.series or len(req.series) == 0:
            # Return zeros if no data
            from datetime import datetime, timedelta
            today = datetime.today().date()
            dates = [(today + timedelta(days=i+1)).strftime("%Y-%m-%d") for i in range(req.days)]
            return {"dates": dates, "balances": [0.0] * req.days}
        
        # Convert to DataFrame
        df = pd.DataFrame([{"ds": p.date, "y": p.value} for p in req.series])
        
        # Ensure we have at least 2 data points for Prophet
        if len(df) < 2:
            from datetime import datetime, timedelta
            today = datetime.today().date()
            dates = [(today + timedelta(days=i+1)).strftime("%Y-%m-%d") for i in range(req.days)]
            avg_value = df['y'].mean() if len(df) > 0 else 0.0
            return {"dates": dates, "balances": [float(avg_value)] * req.days}
        
        df['ds'] = pd.to_datetime(df['ds'])
        df = df.sort_values('ds')
        
        # Initialize and fit Prophet model
        m = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=False,
            changepoint_prior_scale=0.05  # Tune for less aggressive changes
        )
        
        try:
            m.fit(df)
        except Exception as e:
            print(f"Prophet fit error: {e}, using fallback")
            from datetime import datetime, timedelta
            today = datetime.today().date()
            dates = [(today + timedelta(days=i+1)).strftime("%Y-%m-%d") for i in range(req.days)]
            avg_value = df['y'].mean()
            return {"dates": dates, "balances": [float(avg_value)] * req.days}
        
        # Create future dataframe
        future = m.make_future_dataframe(periods=req.days)
        
        # Make prediction
        forecast = m.predict(future)
        
        # Get only future predictions
        preds = forecast.tail(req.days)
        
        # Extract dates and values
        dates = preds['ds'].dt.strftime('%Y-%m-%d').tolist()
        vals = preds['yhat'].astype(float).tolist()
        
        return {"dates": dates, "balances": vals}
        
    except Exception as e:
        print(f"Prediction error: {e}")
        # Fallback: return last value repeated
        from datetime import datetime, timedelta
        today = datetime.today().date()
        dates = [(today + timedelta(days=i+1)).strftime("%Y-%m-%d") for i in range(req.days)]
        last_value = req.series[-1].value if req.series else 0.0
        return {"dates": dates, "balances": [float(last_value)] * req.days}

if __name__ == "__main__":
    import uvicorn
    import sys
    # Fix Windows encoding issues
    if sys.platform == "win32":
        import codecs
        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.buffer, "strict")
        sys.stderr = codecs.getwriter("utf-8")(sys.stderr.buffer, "strict")
    
    # Use PORT from environment (Render provides this) or fallback to PY_PORT
    port = int(os.getenv("PORT") or os.getenv("PY_PORT", "5000"))
    host = os.getenv("HOST") or os.getenv("PY_HOST", "0.0.0.0")
    # Use simple text instead of emoji for Windows compatibility
    print(f"Prophet service starting on http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)

