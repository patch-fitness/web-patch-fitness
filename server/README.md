# Patch Fitness Backend

Node.js + Express REST API connecting the Patch Fitness frontend to the `gym_db1` MySQL database.

## Prerequisites

- Node.js 18+
- An accessible MySQL instance with the `gym_db1` schema (see `../gym_db1.sql`)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create an environment config:
   ```bash
   copy env.example .env
   ```
   Update values as needed. The defaults use:
   - host: `localhost`
   - port: `3306`
   - user: `anpham1`
   - password: `123456`
   - database: `gym_db1`

3. Start the server:
   ```bash
   npm run dev
   ```
   The API listens on `http://localhost:5000` by default.

## Available Routes

All routes are prefixed with `/api`.

- `GET /health` — service status check.
- `GET/POST/PUT/DELETE /gyms`
- `GET/POST/PUT/DELETE /members`
- `GET/POST/PUT/DELETE /memberships`
- `GET/POST/PUT/DELETE /trainers`
- `GET/POST/PUT/DELETE /subscriptions`
- `GET/POST/PUT/DELETE /equipment`
- `GET/POST/PUT/DELETE /transactions`

Each resource supports filtering via query parameters when applicable (e.g. `gymId`, `memberId`, `status`, date ranges).

## Notes

- The server establishes a MySQL connection pool on startup and shuts it down gracefully on exit.
- Update the `CLIENT_ORIGINS` env var to allow additional frontend origins.

