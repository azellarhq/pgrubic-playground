"""API routes."""

import models
import infrastructure
from fastapi import APIRouter
from pgrubic import __version__

router = APIRouter()


@router.post("/lint", response_model=models.LintResult, tags=["linter"])
async def lint_source_code(request: models.LintSourceCode) -> models.LintResult:
    """Lint source code."""
    return infrastructure.lint_source_code(data=request)


@router.post("/format", response_model=models.FormatResult, tags=["formatter"])
async def format_source_code(request: models.FormatSourceCode) -> models.FormatResult:
    """Format source code."""
    return infrastructure.format_source_code(
        data=request,
    )


@router.post("/request/share", response_model=models.ShareResponse, tags=["request"])
async def share_request(request: models.ShareRequest) -> models.ShareResponse:
    """Share request."""
    return infrastructure.share_request(data=request)


@router.get("/request/{request_id}", response_model=models.LoadResult, tags=["request"])
async def get_request(request_id: str) -> models.LoadResult:
    """Get request."""
    return infrastructure.get_request(request_id=request_id)


@router.get("/pgrubic-version", response_model=models.PgrubicVersion, tags=["pgrubic"])
async def pgrubic_version() -> models.PgrubicVersion:
    """Get installed pgrubic version."""
    return models.PgrubicVersion(version=__version__)


@router.get("/health", tags=["utils"])
async def health_check() -> bool:
    """Health check."""
    return True
