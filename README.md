# IncidentAgent — MERN + GenAI + n8n Incident Management Platform

A comprehensive incident management web application that converts alerts and user reports into structured triage, automated remediation suggestions, ticketing & RCA — powered by GenAI chatbot integration and n8n orchestration.

## Architecture Overview

- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Backend**: Node.js + Express + TypeScript + Socket.IO
- **Database**: MongoDB + Redis
- **GenAI Service**: Python FastAPI wrapper around incident chatbot
- **Orchestration**: n8n for workflow automation
- **Deployment**: Docker Compose + GitHub Actions

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- MongoDB (or use Docker)
- Redis (or use Docker)

### Local Development Setup

1. **Clone and setup**

   ```bash
   git clone <repo-url>
   cd incident-agent
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start all services with Docker Compose**

   ```bash
   docker-compose up -d
   ```

3. **Seed the database**

   ```bash
   npm run seed
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - GenAI Service: http://localhost:8000
   - n8n: http://localhost:5678

### Manual Setup (without Docker)

1. **Backend Setup**

   ```bash
   cd services/backend
   npm install
   npm run dev
   ```

2. **Frontend Setup**

   ```bash
   cd services/frontend
   npm install
   npm run dev
   ```

3. **GenAI Service Setup**
   ```bash
   cd services/genai-service
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

## Project Structure

```
incident-agent/
├── services/
│   ├── backend/          # Node.js API server
│   ├── frontend/         # React web app
│   └── genai-service/    # Python FastAPI GenAI wrapper
├── n8n-workflows/        # Importable n8n automation workflows
├── scripts/              # Seed data and utility scripts
├── docs/                 # Documentation
└── tools/                # Mock adapters and utilities
```

## Core Features

### 🎯 Live Incidents Dashboard

- Real-time incident list with severity indicators
- Service filtering and status management
- Quick action buttons (Chat, Create Ticket, Runbook)

### 🤖 Embedded Chat Assistant

- AI-powered incident analysis and triage
- Automated remediation suggestions with confidence scores
- Interactive follow-up questions and guided resolution

### 📋 Guided Incident Submission

- Structured incident creation form
- Service and severity classification
- Automatic bot seeding with incident context

### 🎫 Third-party Integrations

- Jira and PagerDuty ticket creation
- Slack notifications and approval workflows
- Webhook support for monitoring tools

### 📊 Post-incident Analysis

- Automated RCA (Root Cause Analysis) generation
- Metrics dashboard (MTTR, automation savings)
- Audit trail and compliance reporting

### 🔄 n8n Automation Workflows

- Alert → GenAI → Create Ticket → Notify
- Human approval gates for remediation actions
- Post-incident RCA publishing and notifications

## API Endpoints

### Incidents Management

- `POST /api/incidents` - Create new incident
- `GET /api/incidents` - List incidents with filters
- `GET /api/incidents/:id` - Get incident details
- `POST /api/incidents/:id/chat` - Chat with GenAI assistant
- `POST /api/incidents/:id/create-ticket` - Create external ticket
- `POST /api/incidents/:id/run-remediation` - Request remediation
- `POST /api/incidents/:id/generate-rca` - Generate RCA report

### Webhooks

- `POST /webhooks/alerts` - External monitoring alerts
- `POST /webhooks/n8n/:workflowId/callback` - n8n workflow callbacks

### GenAI Service

- `POST /analyze` - Incident analysis and triage
- `POST /generate_rca` - RCA report generation
- `POST /execute_simulation` - Dry-run remediation

## Security & Governance

- **Authentication**: JWT-based with SSO integration hooks
- **Authorization**: Role-based access control (viewer, responder, admin)
- **Audit**: Complete action logging and compliance trail
- **Approval Gates**: Human approval required for destructive operations
- **Rate Limiting**: OpenAI token cost control and API protection

## User Personas

### MD / Ops Manager

- High-level KPI dashboards (MTTR, automation savings)
- Executive incident reports and trends
- Team performance and efficiency metrics

### On-call Engineer

- Quick incident triage and resolution
- Safe remediation execution with approval gates
- Seamless ticket creation and updates

### Support Agent

- Guided triage forms and bot suggestions
- Escalation prevention through automated resolution
- Knowledge base integration and runbook access

## Environment Variables

See `.env.example` for all required environment variables including:

- Database connections (MongoDB, Redis)
- Authentication secrets (JWT, SSO)
- External service credentials (Jira, PagerDuty, Slack)
- GenAI service configuration (OpenAI API key)
- n8n webhook secrets and endpoints

## Testing

```bash
# Run all tests
npm run test

# Backend tests
cd services/backend && npm test

# Frontend tests
cd services/frontend && npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Deployment

### Production Docker Compose

```bash
docker-compose -f infra/docker/production.docker-compose.yml up -d
```

### CI/CD Pipeline

GitHub Actions workflow automatically:

- Lints and tests all services
- Builds Docker images
- Deploys to staging/production environments

## Demo Script for MD Presentation

See `docs/demo-script.md` for a complete 3-minute demonstration flow showcasing:

1. Alert ingestion and automatic triage
2. Chatbot interaction and remediation suggestions
3. Approval workflow and ticket creation
4. Post-incident RCA generation
5. Business impact metrics and ROI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

- Create GitHub issues for bugs and feature requests
- Check the documentation in `docs/` folder
- Review the API specification in `docs/api-spec.md`
