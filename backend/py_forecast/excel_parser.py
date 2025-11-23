"""
Excel file parser service for FinStock Flow
Handles .xlsx and .xls files and categorizes transactions
"""

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
from typing import List, Dict, Any
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Category mapping for automatic categorization
CATEGORY_KEYWORDS = {
    "Food & Dining": ["restaurant", "cafe", "food", "dining", "grocery", "supermarket", "mcdonald", "starbucks", "uber eats", "doordash"],
    "Transport": ["uber", "lyft", "taxi", "gas", "fuel", "parking", "metro", "subway", "bus", "train", "flight", "airline"],
    "Shopping": ["amazon", "target", "walmart", "retail", "store", "shop", "purchase", "mall"],
    "Subscriptions": ["netflix", "spotify", "subscription", "membership", "recurring", "monthly"],
    "Utilities": ["electric", "water", "gas", "utility", "bill", "internet", "phone", "cell", "cable"],
    "Housing": ["rent", "mortgage", "housing", "apartment", "home", "property"],
    "Entertainment": ["movie", "cinema", "theater", "concert", "event", "ticket"],
    "Health": ["pharmacy", "hospital", "doctor", "medical", "health", "drug", "clinic"],
    "Education": ["school", "tuition", "education", "course", "university", "college"],
    "Bills & Fees": ["fee", "charge", "payment", "service", "admin"],
}

def categorize_transaction(description: str, merchant: str = "") -> str:
    """Categorize transaction based on description/merchant"""
    text = f"{description} {merchant}".lower()
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            return category
    
    return "Other"

def parse_excel(file_content: bytes, filename: str) -> List[Dict[str, Any]]:
    """Parse Excel file and return structured transactions"""
    try:
        # Try reading as Excel
        df = pd.read_excel(io.BytesIO(file_content), engine='openpyxl')
    except:
        try:
            # Try with xlrd for older .xls files
            df = pd.read_excel(io.BytesIO(file_content), engine='xlrd')
        except Exception as e:
            raise ValueError(f"Cannot read Excel file: {str(e)}")
    
    transactions = []
    
    # Normalize column names (case-insensitive)
    df.columns = df.columns.str.lower().str.strip()
    
    # Common column name variations
    date_col = None
    amount_col = None
    description_col = None
    merchant_col = None
    category_col = None
    
    for col in df.columns:
        col_lower = col.lower()
        if not date_col and any(word in col_lower for word in ["date", "time", "timestamp"]):
            date_col = col
        if not amount_col and any(word in col_lower for word in ["amount", "value", "price", "cost", "total"]):
            amount_col = col
        if not description_col and any(word in col_lower for word in ["description", "desc", "details", "memo", "note"]):
            description_col = col
        if not merchant_col and any(word in col_lower for word in ["merchant", "vendor", "store", "business", "company"]):
            merchant_col = col
        if not category_col and any(word in col_lower for word in ["category", "cat", "type"]):
            category_col = col
    
    if not date_col or not amount_col:
        raise ValueError("Excel file must contain 'date' and 'amount' columns")
    
    # Process rows
    for idx, row in df.iterrows():
        try:
            date_val = pd.to_datetime(row[date_col]).strftime("%Y-%m-%d") if pd.notna(row[date_col]) else None
            amount_val = float(row[amount_col]) if pd.notna(row[amount_col]) else None
            
            if not date_val or amount_val is None:
                continue
            
            description = str(row[description_col]) if description_col and pd.notna(row.get(description_col)) else ""
            merchant = str(row[merchant_col]) if merchant_col and pd.notna(row.get(merchant_col)) else ""
            category = str(row[category_col]) if category_col and pd.notna(row.get(category_col)) else None
            
            # Auto-categorize if not provided
            if not category:
                category = categorize_transaction(description, merchant)
            
            transactions.append({
                "date": date_val,
                "amount": amount_val,
                "category": category,
                "description": description if description else None,
                "merchant": merchant if merchant else None,
            })
        except Exception as e:
            print(f"Error parsing row {idx}: {e}")
            continue
    
    return transactions

@app.get("/health")
def health():
    return {"status": "ok", "service": "excel_parser"}

@app.post("/parse")
async def parse_excel_file(
    file: UploadFile = File(...),
    userId: str = Form("anon")
):
    """Parse Excel file and return transactions"""
    try:
        if not file.filename.endswith(('.xlsx', '.xls')):
            return {"error": "File must be .xlsx or .xls format"}
        
        content = await file.read()
        transactions = parse_excel(content, file.filename)
        
        return {
            "success": True,
            "transactions": transactions,
            "count": len(transactions)
        }
    except Exception as e:
        return {"error": str(e), "success": False}

if __name__ == "__main__":
    import uvicorn
    import sys
    # Fix Windows encoding issues
    if sys.platform == "win32":
        import codecs
        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.buffer, "strict")
        sys.stderr = codecs.getwriter("utf-8")(sys.stderr.buffer, "strict")
    
    # Use PORT from environment (Render provides this) or fallback to EXCEL_PORT
    port = int(os.getenv("PORT") or os.getenv("EXCEL_PORT", "5001"))
    host = os.getenv("HOST") or os.getenv("EXCEL_HOST", "0.0.0.0")
    # Use simple text instead of emoji for Windows compatibility
    print(f"Excel Parser service starting on http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)

