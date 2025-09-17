from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

app = FastAPI(title="IncidentAgent GenAI Service", version="0.1.0")


class AnalyzeRequest(BaseModel):
    incident_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    signals: Optional[List[Dict[str, Any]]] = None


class RCARequest(BaseModel):
    incident_id: str
    context: Optional[Dict[str, Any]] = None


class SimulationRequest(BaseModel):
    incident_id: str
    hypothesis: str


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze")
def analyze(req: AnalyzeRequest) -> Dict[str, Any]:
    # TODO: Call incident_chatbot_fixed.py pipeline; returning stub for now
    summary = (
        f"Analyzed incident '{req.title}' with description length "
        f"{len(req.description or '')}."
    )
    return {
        "incident_id": req.incident_id,
        "summary": summary,
        "recommended_actions": [
            "Check service health",
            "Review recent deployments",
            "Examine database metrics",
        ],
    }


@app.post("/generate_rca")
def generate_rca(req: RCARequest) -> Dict[str, Any]:
    # TODO: Generate RCA using LLM; returning stub for now
    return {
        "incident_id": req.incident_id,
        "rca": "Likely cause: increased DB latency due to cache misses.",
        "confidence": 0.62,
    }


@app.post("/execute_simulation")
def execute_simulation(req: SimulationRequest) -> Dict[str, Any]:
    # TODO: Execute hypothesis simulation via mocked adapters
    return {
        "incident_id": req.incident_id,
        "hypothesis": req.hypothesis,
        "result": "No regression detected in canary zone",
        "metrics": {"p95_latency_ms": 220, "error_rate": 0.3},
    }
