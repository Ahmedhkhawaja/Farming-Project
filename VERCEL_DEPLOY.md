# Deploying to Vercel

## Setup

1. Push your code to GitHub (or connect your Git provider to Vercel).

2. Import the project in Vercel: https://vercel.com/new

3. Add environment variables in Vercel Dashboard → Settings → Environment Variables:
   - `MONGODB_URI` – Your MongoDB Atlas connection string
   - `JWT_SECRET` – Your JWT secret key

4. Deploy. Vercel will run the build and deploy.

## Local development (unchanged)

- **Backend:** `cd backend && npm start` (runs on port 5000)
- **Frontend:** `cd frontend && npm start` (runs on port 3000)

The frontend uses `http://localhost:5000/api` in development and `/api` (same origin) in production.
