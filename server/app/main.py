from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os
from pathlib import Path

from app.routers import thoughts, exercises, auth

load_dotenv()

app = FastAPI(
    title="ClearMind API",
    description="AI-powered cognitive behavioral therapy API for identifying cognitive distortions and reframing thoughts",
    version="1.0.0"
)

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# CORS configuration
origins = ["http://localhost:3000", "http://localhost:5173"]
if ENVIRONMENT == "production":
    origins = ["*"]  # Allow all in production (served from same domain)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(thoughts.router, prefix="/api", tags=["Thoughts"])
app.include_router(exercises.router, prefix="/api", tags=["Exercises"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Serve static files in production
# In Docker: /app/app/main.py -> /app/client/dist
# Locally: server/app/main.py -> client/dist
STATIC_DIR = Path(__file__).parent.parent / "client" / "dist"
if not STATIC_DIR.exists():
    # Try alternative path for local development
    STATIC_DIR = Path(__file__).parent.parent.parent / "client" / "dist"

if STATIC_DIR.exists():
    # Serve static assets
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    # Catch-all route for SPA - must be after API routes
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Serve index.html for all non-API routes (SPA routing)
        index_path = STATIC_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        return {"error": "Frontend not built"}
else:
    @app.get("/")
    async def root():
        return {
            "name": "ClearMind API",
            "version": "1.0.0",
            "description": "Transform negative thought patterns with AI-powered CBT"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
