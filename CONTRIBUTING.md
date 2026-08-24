# Contributing

Thanks for considering contributing to pgrubic-online. This guide covers everything
you need to get set up and send a change.

## Project layout

- `backend/`: FastAPI service (Python 3.12) that lints/formats SQL via `pgrubic` and
  serves share links.
- `frontend/`: Vite + vanilla JS UI (Monaco editor) that talks to the backend.

Each has its own tooling and CI workflow; changes to one rarely require touching the
other.

## Prerequisites

- Python 3.12+ and [`tox`](https://tox.wiki) with the [`tox-uv`](https://github.com/tox-dev/tox-uv)
  plugin (`pip install tox tox-uv`), which makes tox resolve and install dependencies
  from `uv.lock` for reproducible environments
- Node 24+
- Docker, only if you want to run the full stack together

## Backend setup

```bash
cd backend
tox -e dev --devenv .venv

# activate the virtual environment
source .venv/bin/activate
```

Common commands (all wired through `tox`, matching CI):

| Command | What it does |
| --- | --- |
| `tox -e tests` | Run the test suite |
| `tox -e coverage` | Run tests with coverage (100% required) |
| `tox -e lint` | `ruff check` + `yamllint` |
| `tox -e format` | `ruff format` |
| `tox -e typing` | `mypy` |
| `tox -e isort` | Import sort check |
| `tox -e security` | `bandit` |
| `tox -e docstrings-coverage` | `interrogate` (100% required) |
| `tox -e lock` | Regenerate `uv.lock` after changing dependencies |

Run the API locally:

```bash
cd backend
python app/main.py  # http://localhost:8000, auto-reload in dev
```

## Frontend setup

```bash
cd frontend
npm ci
```

Common commands (from `frontend/`):

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Run tests (watch mode) |
| `npm run coverage` | Run tests with coverage (100% required) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier check |
| `npm run format:fix` | Prettier, writing fixes |
| `npm run build` | Production build |

## Running the full stack with Docker

```bash
docker compose up --build --detach
```

Frontend on `http://localhost`, backend on `http://localhost:8000`.

## Pre-commit

Install once, applies to both backend and frontend:

```bash
pip install pre-commit
pre-commit install
```

This runs formatting, linting, type checking, and commit-message validation on every
commit. CI runs the same checks (`.github/workflows/pre-commit.yml`), so a clean
`pre-commit run --all-files` locally means CI's pre-commit job will pass too.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org) (e.g.
`fix: handle empty share links`, `feat: add dark theme toggle`), enforced by the
commit-msg hook above.

## Submitting a change

1. Branch off `main`.
2. Make your change, keeping backend and frontend changes in separate commits/PRs
   where practical.
3. Ensure `tox` (backend) / `npm run lint && npm run coverage` (frontend) and
   `pre-commit run --all-files` pass locally.
4. Open a PR against `main`. CI must pass before merge.
