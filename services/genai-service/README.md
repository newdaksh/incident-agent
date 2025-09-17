# GenAI Service

FastAPI microservice for IncidentAgent. Wraps the incident analysis pipeline and exposes endpoints:

- GET /health
- POST /analyze
- POST /generate_rca
- POST /execute_simulation

## Local dev

- Create a venv and install: `pip install -e .[dev]`
- Run: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Try: `GET http://localhost:8000/health`
