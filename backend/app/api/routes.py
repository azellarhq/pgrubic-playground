from fastapi import APIRouter
from app import models, infrastructure
from pgrubic import __version__

router = APIRouter()


@router.post("/lint", response_model=models.LintResult, tags=["linter"])
async def lint_source_code(request: models.LintSourceCode) -> models.LintResult:
    return infrastructure.lint_source_code(lint_source_code=request)


@router.post("/format", response_model=models.FormatResult, tags=["formatter"])
async def format_source_code(request: models.FormatSourceCode) -> models.FormatResult:
    return infrastructure.format_source_code(
        format_source_code=request
    )

@router.get("/pgrubic", response_model=str, tags=["pgrubic"])
async def pgrubic_version() -> str:
    return __version__


@router.get("/health", response_model=bool, tags=["utils"])
async def health_check() -> bool:
    return True
