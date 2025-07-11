"""Entrypoint."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pgrubic import core
from pgrubic.core.config import Config
from fastapi import APIRouter
from app.api.routes import linter, formatter, utils
import toml
from typing import Optional, Dict, Any


from app.config import settings

# Register API routes
api_router = APIRouter()
api_router.include_router(linter.router)
api_router.include_router(formatter.router)
api_router.include_router(utils.router)


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
from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="../frontend/dist/"), name="static")


# def create_config(config_input: Optional[Any] = None) -> Config:
#     config = core.parse_config()  # defaults

#     try:
#         if config_input:
#             # If config_input is already a dict (JSON), use it directly
#             if isinstance(config_input, dict):
#                 user_config = config_input
#             elif isinstance(config_input, str):
#                 user_config = toml.loads(config_input)


#             for section_name, section_values in user_config.items():
#                 if hasattr(config, section_name) and isinstance(section_values, dict):
#                     section_obj = getattr(config, section_name)
#                     for key, value in section_values.items():
#                         if hasattr(section_obj, key):
#                             setattr(section_obj, key, value)
#     except Exception as e:
#         print(f"Config parse error: {e}")

#     return config


# @app.post("/format")
# async def format_sql(request: Request) -> Dict[str, Any]:
#     body = await request.json()
#     sql = body.get("text", "")

#     try:
#         config = create_config(body.get("config"))
#         formatter = core.Formatter(
#             config=config,
#             formatters=core.load_formatters
#         )
#         result = formatter.format(
#             source_file="",
#             source_code=sql
#         )

#         return {
#             "formatted": result.formatted_source_code,
#             "changed": result.formatted_source_code != sql,
#             "errors": [str(e) for e in result.errors] if result.errors else None
#         }

#     except Exception as e:
#         return {
#             "error": str(e),
#             "formatted": sql,
#             "changed": False
#         }
# def violation_to_dict(v):
#     return {
#         "rule_code": getattr(v, "rule_code", ""),
#         "rule_name": getattr(v, "rule_name", ""),
#         "rule_category": getattr(v, "rule_category", ""),
#         "line_number": getattr(v, "line_number", ""),
#         "column_offset": getattr(v, "column_offset", ""),
#         "description": getattr(v, "description", ""),
#         "help": getattr(v, "help", ""),
#         "is_auto_fixable": getattr(v, "is_auto_fixable", False),
#         "is_fix_enabled": getattr(v, "is_fix_enabled", False),
#     }

# @app.post("/lint")
# async def lint_sql(request: Request) -> Dict[str, Any]:
#     try:
#         body = await request.json()
#         sql = body.get("text", "")
#         config_toml = body.get("config", "")
#         fix_enabled = body.get("fix", False)  # Fix is controlled by frontend

#         if not sql:
#             return {
#                 "error": "Missing 'text' field in request.",
#                 "violations": []
#             }

#         config = create_config(config_toml)
#         config.lint.fix = fix_enabled   # Dynamically set fix behavior here

#         linter = core.Linter(config=config, formatters=core.load_formatters)

#         rules = core.load_rules(config=config)
#         for rule_class in rules:
#             linter.checkers.add(rule_class())

#         result = linter.run(source_file="", source_code=sql)

#         fixed_code = result.fixed_source_code if fix_enabled else ""

#         return {
#             "violations": [violation_to_dict(v) for v in result.violations],
#             "fixed_source": fixed_code,
#         }

#     except Exception as e:
#         return {"error": str(e), "violations": []}
