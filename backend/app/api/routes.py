"""API routes."""

import models
import infrastructure
from fastapi import APIRouter
from pgrubic import __version__

router = APIRouter()


@router.post("/lint", response_model=models.LintResult, tags=["linter"])
async def lint_source_code(request: models.LintSourceCode) -> models.LintResult:
    """Lint source code."""
    return infrastructure.lint_source_code(lint_source_code=request)


@router.post("/format", response_model=models.FormatResult, tags=["formatter"])
async def format_source_code(request: models.FormatSourceCode) -> models.FormatResult:
    """Format source code."""
    return infrastructure.format_source_code(
        format_source_code=request,
    )


@router.get("/pgrubic-version", tags=["pgrubic"])
async def pgrubic_version() -> str:
    """Get installed pgrubic version."""
    return __version__


@router.get("/health", tags=["utils"])
async def health_check() -> bool:
    """Health check."""
    return True
