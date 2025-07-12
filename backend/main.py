"""Entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter
from app.api import routes
from fastapi.staticfiles import StaticFiles
from app.config import settings

# Register API routes
api_router = APIRouter()
api_router.include_router(routes.router)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.PROJECT_DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

app.mount("/", StaticFiles(directory="../frontend/dist/", html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
