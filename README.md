# EduFlow LMS

EduFlow is an AI-powered Learning Management System (LMS) designed for educational institutions. It provides a robust backend (FastAPI, Python) and a modern frontend (React, TypeScript, Vite) for managing courses, users, assignments, discussions, and more.

---

## Project Structure

```
/ (project root)
│
├── backend/      # FastAPI backend (Python)
│   ├── app.py, main.py, ...
│   ├── services/, routers/, middleware/, utils/, uploads/, tests/
│   ├── requirements.txt, Dockerfile, docker-compose.yml, lms.db, ...
│
├── frontend/     # React frontend (TypeScript, Vite)
│   ├── src/
│   ├── package.json, vite.config.js, tailwind.config.js, ...
│
├── venv311/ or venv/   # Python virtual environment (not required for deployment)
│
└── README.md     # This file
```

---

## Features
- User authentication (JWT, roles: admin, lecturer, student)
- Course, program, and department management
- Assignment and quiz management
- AI-powered Q&A (Gemini, OpenAI integration)
- PDF and audio processing (optional)
- Real-time features (WebSocket, Redis)
- Analytics and dashboards
- Modern, responsive frontend (React + Tailwind CSS)

---

## Backend Setup (FastAPI)

1. **Navigate to backend directory:**
   ```sh
   cd backend
   ```
2. **Create and activate a virtual environment:**
   ```sh
   python -m venv venv
   # On Windows:
   .\venv\Scripts\Activate.ps1
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```
4. **Set environment variables:**
   - Create a `.env` file in `backend/` with:
     ```
     DATABASE_URL=sqlite:///lms.db
     JWT_SECRET_KEY=your-secret-key
     GEMINI_API_KEY=your-gemini-key
     OPENAI_API_KEY=your-openai-key
     CORS_ORIGINS=http://localhost:5173
     ```
5. **Run the backend server:**
   ```sh
   python app.py
   # or
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   - API available at: http://localhost:8000

---

## Frontend Setup (React + Vite)

1. **Navigate to frontend directory:**
   ```sh
   cd frontend
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Run the frontend dev server:**
   ```sh
   npm run dev
   ```
   - App available at: http://localhost:5173

---

## Deployment
- **Docker Compose:** Use `docker-compose.yml` in `backend/` for full-stack deployment (backend, Postgres, Redis, Nginx).
- **Frontend:** Can be built and deployed separately (see Vite docs).
- **Backend:** Can be deployed with Uvicorn, Gunicorn, or any ASGI server.

---

## Notes
- For local development, SQLite is used by default. For production, configure PostgreSQL in `.env` and `docker-compose.yml`.
- Some AI features require valid API keys (Gemini, OpenAI).
- Remove or comment out optional dependencies in `requirements.txt` if you do not need certain features (e.g., Whisper, Pillow).

---

## License
This project is for educational purposes. See LICENSE file if present. 