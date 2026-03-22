# NexaBank AI Platform

AI-powered banking assistant with Branch Kiosk, Contact Center Co-Pilot, and Privacy Proxy.

## Architecture

```
ideachallenge/
  frontend/          ← React app (Vite, port 3000)
    src/
      components/    ← BranchKiosk, ContactCenter, PrivacyProxy, etc.
      agent.js       ← Groq API calls via backend proxy
      App.jsx        ← Tab routing + layout
      index.jsx      ← Entry point
      index.css      ← White/red glassmorphism theme
    public/
    package.json
  backend/           ← Express proxy (port 5000)
    server.js        ← POST /api/chat → Groq, GET /health
    .env             ← GROQ_API_KEY
    package.json
```

## Quick Start

### 1. Backend (Terminal 1)

```bash
cd backend
npm install
node server.js
```

Server starts on **http://localhost:5000**

### 2. Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

App opens on **http://localhost:3000**

## Environment Variables

Create `backend/.env`:

```
GROQ_API_KEY=your_groq_api_key_here
```

## Tech Stack

| Layer    | Tech                                       |
| -------- | ------------------------------------------ |
| Frontend | React 18, Vite, Three.js (R3F), plain CSS  |
| Backend  | Express, Axios, CORS, dotenv               |
| AI       | Groq API (llama-3.3-70b-versatile)         |
