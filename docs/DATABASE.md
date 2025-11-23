# Database Setup Guide

This guide covers PostgreSQL database setup for FinStock Flow.

## Quick Start

1. **Install PostgreSQL** (if not installed):
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - **Mac**: `brew install postgresql@15`
   - **Linux**: `sudo apt-get install postgresql postgresql-contrib`

2. **Create Database**:
   ```bash
   createdb finstock
   # Or using psql:
   psql -U postgres
   CREATE DATABASE finstock;
   \q
   ```

3. **Configure Connection**:
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/finstock
   ```

4. **Start Backend**: Tables are automatically created on first run!

For detailed instructions, see [DATABASE_SETUP.md](DATABASE_SETUP.md).

