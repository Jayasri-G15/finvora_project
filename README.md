# Finvora AI

**Enterprise-grade Autonomous AI Financial Management Agent**

Finvora AI connects directly to your organization's Gmail, extracts structured financial data from emails and attachments using Claude AI, and surfaces real-time insights through a high-performance analytics platform — functioning as an autonomous AI CFO assistant.

---

## Features

- **Gmail-driven financial sync** — OAuth-connected real-time email ingestion with Pub/Sub push
- **AI extraction engine** — Claude AI extracts invoices, payments, GST details, vendor info, and more from email content and PDF attachments
- **Invoice lifecycle management** — Full Draft → Approved → Paid → Voided state machine
- **Transaction tracking** — Auto-classified credits and debits with vendor linkage
- **Budget management** — Category-based allocations with over-budget alerts
- **Approval workflows** — Multi-step approval chains for invoices and payments
- **AI-generated reports** — Monthly, quarterly, and custom financial reports with forecasting
- **Real-time alerts** — Rule-based alerts for overdue invoices, budget thresholds, anomalies
- **Enterprise UI** — Dark glassmorphism design, virtualised tables for 100k+ rows, animated dashboards

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Python 3.12 + FastAPI (async) |
| Database | PostgreSQL 16 + SQLAlchemy 2.0 (async) + Alembic |
| Task Queue | Celery 5 + Redis 7 |
| AI | Anthropic Claude (`claude-sonnet-4-6`) — tool use + prompt caching |
| Gmail | Google Gmail API v1 + OAuth2 + Pub/Sub push |
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| Charts | Recharts + Framer Motion |
| Data Tables | TanStack Table v8 (row virtualisation) |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Google Cloud project with Gmail API + Pub/Sub enabled
- Anthropic API key

### Setup

```bash
# 1. Clone and configure environment
cp .env.example .env
# Edit .env with your Google OAuth credentials and Anthropic API key

# 2. Start all services
docker compose up --build

# 3. Run database migrations (first time)
docker compose exec backend alembic revision --autogenerate -m "initial_schema"
docker compose exec backend alembic upgrade head
```

### Access

| Service | URL |
|---|---|
| Frontend app | http://localhost:3000 |
| Backend API docs | http://localhost:8000/docs |
| Backend ReDoc | http://localhost:8000/redoc |

---

## Project Structure

```
finvora-ai/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/      # Route handlers
│   │   ├── models/   # SQLAlchemy ORM models
│   │   ├── schemas/  # Pydantic request/response schemas
│   │   ├── services/ # Business logic
│   │   ├── tasks/    # Celery async tasks
│   │   └── integrations/  # Google + Claude API clients
│   └── ...
├── frontend/         # Next.js 14 application
│   ├── app/          # App Router pages
│   ├── components/   # React components
│   ├── hooks/        # TanStack Query hooks
│   └── ...
└── docker-compose.yml
```

---

## License

Proprietary — Finvora AI © 2025
