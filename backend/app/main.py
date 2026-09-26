from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import get_database
from app.routers import auth, organizations, jobs, schedules, interviews, reports, resume

app = FastAPI(
    title="AURA · TALENT Executive AI Interview Suite API",
    description="Backend services for Candidate & Recruiter AI Interview Platform",
    version="2.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(organizations.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(schedules.router, prefix="/api")
app.include_router(interviews.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(resume.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    db = get_database()
    if db is not None:
        print("[DATABASE] Connected to MongoDB database successfully.")
    else:
        print("[DATABASE] Operating in high-performance memory-backed repository mode.")

@app.get("/")
def root():
    return {
        "platform": "AURA · TALENT Executive AI Interview Suite",
        "status": "online",
        "version": "2.0.0"
    }

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "aura_talent_api"}
