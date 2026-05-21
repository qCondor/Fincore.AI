# Fincore.AI

Fincore is a fintech app that combines Big Five personality assessment with AI-powered financial coaching. Users complete a 15-question survey to generate their financial personality profile, then receive personalized money advice from an AI coach that adapts to their personality traits.

## Architecture

```
Fincore.AI/
├── prototype/          # Next.js 16 frontend (React 19, Tailwind 4, TypeScript)
│   └── src/
│       ├── app/        # App Router pages
│       ├── components/ # UI components (ChatScreen, PhoneFrame, etc.)
│       ├── hooks/      # useChat.ts, useScan.ts
│       └── lib/        # questions.ts (survey data)
├── my-agent/           # Python backend
│   ├── server.py       # FastAPI server (CORS enabled)
│   ├── coach.py        # Claude-powered financial coach (streams via SSE)
│   ├── scorer.py       # Big Five personality scorer
│   ├── image_agent.py  # Product image analysis (Bedrock)
│   ├── price_matcher.py# Supermarket price lookup
│   └── agent.py        # Dev agent using Claude Agent SDK
└── prototype.html      # Static design prototype
```

## Running the App

**Frontend** (port 3000):
```bash
cd prototype && npm install && npm run dev
```

**Backend** (port 8000):
```bash
cd my-agent && pip install fastapi uvicorn boto3 claude-agent-sdk
FINCORE_S3_BUCKET=your-bucket uvicorn server:app --reload
```

## API Endpoints (FastAPI)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/score` | POST | Submit 15-answer survey, returns Big Five scores |
| `/profile` | POST | Upsert user profile |
| `/profile/{user_id}` | GET | Fetch user profile |
| `/chat` | POST | Stream AI coach response (SSE) |
| `/analyze` | POST | Analyze product image via Bedrock |
| `/price-check` | POST | Look up supermarket prices by barcode |

## Environment Variables

- `FINCORE_S3_BUCKET` - S3 bucket for user profiles (required)
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `AWS_BEARER_TOKEN_BEDROCK` - Optional, routes coach through Bedrock

## Key Conventions

- **British English** - pounds, not dollars
- **Personality-driven** - All coach responses must adapt to user's Big Five profile
- **Streaming** - Chat uses SSE with JSON-encoded chunks
- **No regulated advice** - Coach gives guidance, not financial advice

## Development Commands

```bash
# Frontend
cd prototype && npm run dev      # Start dev server
cd prototype && npm run build    # Production build
cd prototype && npm run lint     # ESLint

# Backend
cd my-agent && uvicorn server:app --reload  # Start API server
cd my-agent && python agent.py "task"       # Run dev agent

# Testing
# (tests not yet configured)
```
