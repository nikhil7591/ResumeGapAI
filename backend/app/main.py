from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, billing, reviews, webhooks

app = FastAPI(title="AI Resume Reviewer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reviews.router)
app.include_router(billing.router)
app.include_router(webhooks.router)


@app.get("/health")
def health():
    return {"status": "ok"}
