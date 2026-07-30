# CYBERMIND AI — Coding Standards & Guidelines

---

## 1. Subsystem Directory Structure

To maintain clean architecture and strict modularization, code MUST adhere to the following structure:

```text
cybermind-ai/
├── docs/                      # Architecture, ADRs, Threat Models, Specifications
├── prisma/                    # Schema, Migrations, Seeders
├── src/
│   ├── main.ts                # Application Entry Point
│   ├── app.module.ts          # Core NestJS Root Module
│   ├── config/                # Environment Configuration & Schema Validation
│   ├── logger/                # Pino Structured Logging Service
│   ├── health/                # Health Check & Monitoring Endpoints
│   ├── auth/                  # JWT + TOTP MFA Guards & Controllers
│   ├── ai-gateway/            # Autonomous AI Gateway Subsystem
│   │   ├── providers/         # OpenAI, Anthropic, Gemini, Ollama Adapters
│   │   ├── router/            # Smart Provider Router Logic
│   │   ├── cost/              # Token Counting & USD Cost Guard
│   │   ├── streaming/         # SSE Stream Multiplexer
│   │   ├── circuit-breaker/   # Resilience & Circuit Breaker Logic
│   │   ├── retry/             # Exponential Backoff Retry Handling
│   │   └── telemetry/         # OpenTelemetry / Cost Metrics Tracker
│   ├── events/                # Redis PubSub & BullMQ Queue Dispatchers
│   ├── knowledge/             # CVE/CISA Crawler & Hybrid Search Service
│   ├── graph/                 # Cyber Knowledge Graph Engine
│   └── sandbox/               # Ephemeral Docker File Sandbox Manager
├── ecosystem.config.js        # PM2 Configuration
├── package.json
└── tsconfig.json
```

---

## 2. Core Coding Rules

1. **Strict TypeScript:** `tsconfig.json` MUST enforce `"strict": true` and `"noImplicitAny": true`.
2. **Repository Pattern:** Controllers and Business Services MUST NEVER call Prisma directly; all database calls pass through a typed repository class.
3. **Input Validation:** Every controller endpoint MUST validate incoming payloads using `class-validator` DTOs.
4. **Structured Logging:** All logs MUST be formatted as JSON using NestJS Pino logger, including `requestId` and `traceId`.
5. **No Secrets in Code:** Secrets must reside strictly in `.env`. Never commit API keys or credentials.
