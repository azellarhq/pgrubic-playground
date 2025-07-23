"""Entrypoint."""

import uvicorn
from api import routes
from config import settings
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

# Register API routes
api_router = APIRouter()
api_router.include_router(routes.router)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs" if settings.ENVIRONMENT != settings.ENVIRONMENT.PRODUCTION else None,
    redoc_url="/redoc"
    if settings.ENVIRONMENT != settings.ENVIRONMENT.PRODUCTION
    else None,
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST_BIND,
        port=settings.HOST_PORT,
        reload=settings.ENVIRONMENT == settings.ENVIRONMENT.DEVELOPMENT,
        log_level="debug",
    )
