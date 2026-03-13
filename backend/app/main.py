"""FastAPI application entry point."""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import event_types, availability, bookings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cal Clone API",
    description="Scheduling platform API — a Cal.com clone",
    version="1.0.0",
)

# CORS — allow the React frontend
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
if settings.FRONTEND_URL not in allowed_origins:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(event_types.router)
app.include_router(availability.router)
app.include_router(bookings.router)


@app.get("/")
def root():
    return {"message": "Cal Clone API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
