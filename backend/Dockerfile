ARG PYTHON_IMAGE=python:3.14-slim@sha256:ce40764625a4ff50df3548277632e7f96c4e77fe75fa848aae9885476e7df5a4

FROM ${PYTHON_IMAGE} AS builder

# Install uv
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.12.5@sha256:e85be844203885286c60ffad8a858d48afb6c5a5c237ca0e67f12e74b8f174b1 /uv /usr/local/bin/uv

WORKDIR /src

COPY pyproject.toml uv.lock ./

RUN uv sync --locked --no-dev --no-install-project

COPY app app

FROM ${PYTHON_IMAGE}

WORKDIR /src

COPY --from=builder /src/.venv .venv

COPY --from=builder /src/app app

ENV PATH="/src/.venv/bin:$PATH"

ENV PYTHONUNBUFFERED=1

# Switch to non-root user.
USER 10001

CMD ["python3", "app/main.py"]
