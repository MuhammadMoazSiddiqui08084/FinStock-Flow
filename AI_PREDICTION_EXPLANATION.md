# How AI Judges Predicted Balance in FinStock Flow

## Overview

FinStock Flow uses a combination of **Prophet time-series forecasting** and **AI (Grok) analysis** to predict future cashflow balances and provide actionable recommendations.

## Prediction Pipeline

### 1. **Historical Data Analysis**

The system first analyzes your transaction history:

```
Historical Transactions → Daily Balance Calculation → Time Series Data
```

- **Input**: All transactions from your database (expenses as negative, revenue as positive)
- **Processing**: Transactions are grouped by date and summed to get daily balances
- **Output**: Time series of daily balance values: `[{date: "2024-01-01", balance: 1500}, ...]`

### 2. **Prophet Forecasting (Primary Method)**

**Prophet** (by Facebook) is a time-series forecasting algorithm that:

- **Analyzes patterns**:
  - **Trends**: Overall direction (increasing/decreasing balance)
  - **Seasonality**: Weekly patterns (e.g., more spending on weekends)
  - **Holidays/Events**: Special spending days
  - **Changepoints**: Points where spending patterns change

- **Creates forecast model**:
  ```python
  model = Prophet(daily_seasonality=False, weekly_seasonality=True)
  model.fit(historical_data)
  future = model.make_future_dataframe(periods=14)
  forecast = model.predict(future)
  ```

- **Generates predictions**: 14-day ahead forecast with confidence intervals

**Key Features**:
- Handles missing data
- Robust to outliers
- Adapts to changing patterns
- Provides uncertainty estimates

### 3. **Fallback: Moving Average**

If Prophet service is unavailable, uses **Simple Moving Average**:
- Calculates average of last 7 days
- Projects forward with smoothing
- Less accurate but always available

### 4. **AI Analysis (Grok API)**

After generating forecast, **Grok AI** analyzes:

#### A. **Action Generation** (`/actions` endpoint)

**Input**:
- Forecast data (dates, predicted balances)
- Spending categories with amounts
- Current financial context

**AI Prompt**:
```
Given forecast showing cashflow trends and spending categories,
generate 3 actionable recommendations ranked by impact.
```

**AI Outputs**:
- 3 ranked actions (e.g., "Reduce Food by 20%")
- `buffer_gain_days`: Estimated days gained before going negative
- `risk`: Low/Med/High lifestyle impact
- `explanation`: Why this action helps

**How AI Judges**:
1. **Identifies critical categories**: Looks at forecast trends + category spending
2. **Calculates impact**: Estimates how reducing each category extends runway
3. **Assesses feasibility**: Considers risk level and lifestyle impact
4. **Ranks by effectiveness**: Orders by `buffer_gain_days`

#### B. **Simulation Analysis** (`/simulate` endpoint)

When you simulate an action:

**Process**:
1. **Applies action to historical data**:
   - If "Reduce Food by 20%": Multiplies all Food category transactions by 0.8
   - If "Pause subscriptions ($35)": Reduces subscription amount by $35

2. **Recalculates forecast**:
   - Re-runs Prophet with modified data
   - Generates new 14-day forecast

3. **Compares results**:
   ```javascript
   before_first_negative_day: 8  // Original forecast
   after_first_negative_day: 12  // After action
   improvement_days: 4            // Days gained
   delta_balance: 123.45          // Final balance difference
   ```

4. **AI Explanation**:
   - Analyzes the simulation results
   - Provides brief explanation (max 80 chars)
   - Example: "This action delays negative balance by 4 days and improves final balance by $123.45"

**How AI Judges Balance**:

1. **Trend Analysis**:
   - Looks at forecast slope (positive/negative trend)
   - Identifies when balance crosses zero
   - Calculates days until negative

2. **Impact Assessment**:
   - Compares before/after forecasts
   - Calculates `improvement_days` = `after_first_negative` - `before_first_negative`
   - Calculates `delta_balance` = final balance difference

3. **Contextual Understanding**:
   - Considers current balance level
   - Factors in spending patterns
   - Accounts for seasonal variations

### 5. **Anomaly Detection**

**Statistical Method (Z-Score)**:
- Calculates mean and standard deviation for each category
- Flags transactions > 2σ (2 standard deviations) from mean
- Severity based on Z-score:
  - **Low**: |Z| > 2
  - **Medium**: |Z| > 2.5
  - **High**: |Z| > 3

**Formula**:
```
z_score = (transaction_amount - category_mean) / category_std_dev
```

## Example Flow

### Scenario: User has $1500, spending $100/day

1. **Historical Data**: 
   - Last 30 days of transactions
   - Daily balances: [1500, 1400, 1300, ...]

2. **Prophet Forecast**:
   - Predicts balance will reach $0 on day 15
   - Shows trend: decreasing balance

3. **AI Action Generation**:
   - Analyzes: "User spending $300/month on Food, $200 on Transport"
   - Generates: "Reduce Food by 20% → saves $60/month → adds 3 days"
   - Ranks actions by impact

4. **User Simulates Action**:
   - System reduces all Food transactions by 20%
   - Re-runs Prophet with modified data
   - New forecast: Balance reaches $0 on day 18 (3 days improvement)
   - AI explains: "Cutting dining out delays negative balance by 3 days"

5. **User Applies Action**:
   - If user clicks "Apply All", system simulates all actions combined
   - Shows cumulative impact

## Key Metrics

- **Days Until Negative**: When balance hits $0
- **Improvement Days**: Extra days gained from action
- **Delta Balance**: Final balance difference
- **Risk Level**: Low/Med/High lifestyle impact

## Technical Details

### Prophet Model Configuration

```python
Prophet(
    daily_seasonality=False,      # No daily patterns
    weekly_seasonality=True,       # Weekly spending patterns
    yearly_seasonality=False,      # No yearly patterns
    changepoint_prior_scale=0.05   # Sensitivity to trend changes
)
```

### Grok API Integration

**Endpoint**: `https://api.x.ai/v1/chat/completions`

**Model**: `grok-beta`

**Temperature**: 0.7 (balanced creativity/consistency)

**Token Limits**: 
- Actions: 800 tokens
- Explanations: 100 tokens

## Limitations

1. **Historical Data**: Needs at least 7 days of data for accurate forecasts
2. **Prophet Assumptions**: Assumes patterns continue (may miss sudden changes)
3. **AI Accuracy**: Depends on prompt quality and API responses
4. **Simplified Actions**: Actions assume linear reductions (reality is more complex)

## Future Enhancements

- Multi-variate Prophet (include external factors)
- Machine learning categorization (improve auto-categorization)
- Personalized recommendations (learn from user behavior)
- Real-time updates (adjust forecasts as new data arrives)

