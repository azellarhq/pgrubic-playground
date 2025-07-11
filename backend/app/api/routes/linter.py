"""Linter routes."""

from fastapi import APIRouter
from app import models, infrastructure

router = APIRouter(prefix="/lint", tags=["linter"])

@router.post("", response_model=models.LintResult)
async def lint_source_code(request: models.LintSourceCode) -> models.LintResult:
    return infrastructure.lint_source_code(source_code=request)
