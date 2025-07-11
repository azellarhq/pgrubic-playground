"""Formatter routes."""

from fastapi import APIRouter
from app import models, infrastructure
router = APIRouter(prefix="/format", tags=["formatter"])


@router.post("", response_model=models.FormatResult)
async def format_source_code(request: models.FormatSourceCode) -> models.FormatResult:
    return infrastructure.format_source_code(source_code=request.source_code, config=request.config)
    # return models.FormatResult(formatted_source_code="")
