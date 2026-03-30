import uuid
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

import models
from database import Base, SessionLocal, engine
from routers import alerts, chat, dashboard, profiles, requests

UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Smart Healthcare Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(profiles.router, prefix="/api")
app.include_router(requests.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.on_event("startup")
def startup_event():
    with engine.begin() as conn:
        try:
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        except Exception:
            # Extension creation is optional when UUIDs are generated in application code.
            pass

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing_user = db.query(models.User).first()
        if not existing_user:
            db.add(
                models.User(
                    id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
                    name="Demo User",
                    email="demo@health.ai",
                )
            )
            db.commit()
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"ok": True}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
