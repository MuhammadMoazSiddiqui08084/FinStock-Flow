# API Documentation

Complete API reference for FinStock Flow backend.

For detailed endpoint documentation, see [README-BACKEND.md](README-BACKEND.md).

## Base URL

```
http://localhost:4000
```

## Authentication

Most endpoints support anonymous access (userId: "anon") but authenticated users have data isolation.

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## Core Endpoints

### Health Check
```http
GET /health
```

### Get Forecast
```http
GET /forecast?userId=123&days=14
```

### Get Categories
```http
GET /categories?userId=123
```

### Get Transactions
```http
GET /transactions?userId=123
```

### Add Transaction
```http
POST /transactions
Content-Type: application/json

{
  "date": "2024-01-15",
  "amount": 50.00,
  "category": "Food & Dining",
  "type": "expense",
  "description": "Lunch",
  "merchant": "Restaurant"
}
```

For complete API documentation, see [README-BACKEND.md](README-BACKEND.md).

