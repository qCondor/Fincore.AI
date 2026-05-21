# Fincore.AI

Fincore is a fintech app that combines Big Five personality assessment with AI-powered financial coaching. Users complete a 15-question survey to generate their financial personality profile, then receive personalized money advice from an AI coach that adapts to their personality traits.

## Architecture Overview

- **Frontend**: Next.js 16 (React 19, Tailwind 4, TypeScript)
- **Backend**: Python FastAPI server with CORS enabled
- **AI**: AWS Bedrock (Claude Sonnet for vision, Claude for chat)
- **Storage**: S3 for user data persistence
- **Observability**: Langfuse for tracing and analytics

```
Fincore.AI/
├── prototype/          # Next.js 16 frontend
│   └── src/
│       ├── app/        # App Router pages
│       ├── components/ # UI components (ChatScreen, PhoneFrame, etc.)
│       ├── hooks/      # useChat.ts, useScan.ts
│       └── lib/        # questions.ts, utilities
├── my-agent/           # Python backend
│   ├── server.py       # FastAPI server
│   ├── coach.py        # Claude-powered financial coach (SSE streaming)
│   ├── scorer.py       # Big Five personality scorer
│   ├── image_agent.py  # Product image analysis (Bedrock)
│   └── price_matcher.py# Supermarket price lookup
└── prototype.html      # Static design prototype
```

## Production Utilities (`prototype/src/lib/`)

### Secure Storage (`secure-storage.ts`)

iOS-ready storage abstraction with base64 obfuscation for sensitive data.

- **Purpose**: Provides a unified interface for secure storage that works across web and native iOS
- **Usage**: `await SecureStorage.setItem('key', 'value')`
- **Migration**: Automatically migrates legacy `fincore_user_id` keys to the new format
- **Future**: Ready for Capacitor Secure Storage plugin swap when deploying to iOS

### Image Compression (`image-compression.ts`)

Client-side image optimization before Bedrock upload.

- **Purpose**: Reduces bandwidth and API costs by compressing images before upload
- **Config**: 1024px max dimension, 85% JPEG quality
- **Achieves**: 10-50x compression on typical phone photos
- **Usage**: `const result = await compressImage(dataUrl, options)`

### Fetch with Retry (`fetch-with-retry.ts`)

Timeout and retry logic for all API calls.

- **Purpose**: Ensures reliable API communication with automatic retry on transient failures
- **Features**: Exponential backoff, user-friendly error messages, configurable timeouts
- **Timeouts**:
  - 15s standard API calls
  - 30s for image analysis
  - 90s for chat SSE streaming

### API Configuration (`api-config.ts`)

Centralized backend URL management.

- **Purpose**: Single source of truth for all backend endpoint URLs
- **Validation**: Throws at runtime in production if `BACKEND_URL` is missing
- **Endpoints**: All backend routes as typed constants

## S3 Data Schemas

### Conversation History (`users/{user_id}/conversations/history.json`)

```json
{
  "schema_version": 2,
  "messages": [
    {
      "role": "user|assistant",
      "content": "message text",
      "timestamp": "ISO8601",
      "scan_reference": {
        "scan_id": "...",
        "product_name": "...",
        "category": "..."
      },
      "financial_metadata": {
        "psychology_cost": 15.50,
        "base_price": 12.99
      },
      "session_id": "session_xxx"
    }
  ]
}
```

### User Profile (`users/{user_id}/profile.json`)

- `big_five`: OCEAN scores (0-100 for each trait)
- `name`: User display name
- `email`: User email address
- `auth_provider`: Authentication method used

### Scan Records (`users/{user_id}/scans/{scan_id}.json`)

- Product identification details
- Psychology cost breakdown
- Scan scores and analysis results

## Environment Variables

### Required for Production

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | Python FastAPI server URL |
| `FINCORE_S3_BUCKET` | S3 bucket name for user data |
| `AWS_REGION` | AWS region (default: us-east-1) |
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `LANGFUSE_CHAT_PK` | Langfuse chat public key |
| `LANGFUSE_CHAT_SK` | Langfuse chat secret key |
| `LANGFUSE_CAMERA_PK` | Langfuse camera public key |
| `LANGFUSE_CAMERA_SK` | Langfuse camera secret key |

### Optional

| Variable | Description |
|----------|-------------|
| `AWS_BEARER_TOKEN_BEDROCK` | Routes coach through Bedrock |

## iOS Considerations

The app includes full safe-area support for iOS devices:

- **CSS Variables**: Uses `env(safe-area-inset-*)` for proper inset handling
- **Utility Classes**: `.safe-top`, `.safe-bottom` for common padding needs
- **Viewport**: `viewport-fit: cover` enabled in `layout.tsx`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/score` | POST | Submit 15-answer survey, returns Big Five scores |
| `/profile` | POST | Upsert user profile |
| `/profile/{user_id}` | GET | Fetch user profile |
| `/chat` | POST | Stream AI coach response (SSE) |
| `/analyze` | POST | Analyze product image via Bedrock |
| `/price-check` | POST | Look up supermarket prices by barcode |

## Development Commands

```bash
# Frontend (port 3000)
cd prototype && npm install && npm run dev

# Backend (port 8000)
cd my-agent && pip install fastapi uvicorn boto3
FINCORE_S3_BUCKET=your-bucket uvicorn server:app --reload
```

## Psychology Cost (Personality Tax) Algorithm

The "Feels Like" scanner calculates a **Psychology Cost** — the premium you're likely to pay based on your personality traits. This is the core financial insight unique to Fincore.

### Formula

```
Psychology Cost = Base Price × (1 + Σ(trait_weight × trait_deviation))
```

### Trait Weights

| OCEAN Trait | Weight | Effect |
|-------------|--------|--------|
| **Openness** | +0.15 | High scorers pay more for novel/premium products |
| **Conscientiousness** | -0.10 | High scorers compare prices, negotiate |
| **Extraversion** | +0.12 | High scorers susceptible to social proof |
| **Agreeableness** | +0.08 | High scorers avoid haggling, accept first price |
| **Neuroticism** | +0.18 | High scorers make impulse buys under stress |

### Example Calculation

User with: O=75, C=40, E=80, A=65, N=70

```
Base Price: £29.99

O deviation: (75-50)/100 = +0.25 → +0.25 × 0.15 = +0.0375
C deviation: (40-50)/100 = -0.10 → -0.10 × -0.10 = +0.0100
E deviation: (80-50)/100 = +0.30 → +0.30 × 0.12 = +0.0360
A deviation: (65-50)/100 = +0.15 → +0.15 × 0.08 = +0.0120
N deviation: (70-50)/100 = +0.20 → +0.20 × 0.18 = +0.0360

Total multiplier: 1 + (0.0375 + 0.01 + 0.036 + 0.012 + 0.036) = 1.1315
Psychology Cost: £29.99 × 1.1315 = £33.93

"Feels Like" premium: £3.94 (13.15% personality tax)
```

## Feature Roadmap

### V1.0 (Current - TestFlight Ready)

| Feature | Status |
|---------|--------|
| Big Five Quiz (15 questions) | ✅ Live |
| Faith AI Coach (SSE streaming) | ✅ Live |
| Feels Like Scanner (Bedrock vision) | ✅ Live |
| User Profiles (S3 persistence) | ✅ Live |
| Chat History (conversation continuity) | ✅ Live |
| Quiz Persistence (resume interrupted sessions) | ✅ Live |
| Haptic Feedback (iOS-ready) | ✅ Live |

### V1.1 (Planned - Q3 2026)

| Feature | Status |
|---------|--------|
| Open Banking Integration | 🔜 Coming Soon |
| Financial Analytics Dashboard | 🔜 Coming Soon |
| Spending Pattern Analysis | 🔜 Coming Soon |

Users can join the waitlist for V1.1 features via the "Coming Soon" modal.

## Waitlist Schema (`users/global/waitlist.json`)

```json
{
  "entries": [
    {
      "email": "user@example.com",
      "feature": "banking",
      "timestamp": "2026-05-08T22:30:00Z"
    }
  ]
}
```

## Key Conventions

- **British English**: Uses pounds, not dollars
- **Personality-driven**: All coach responses adapt to user's Big Five profile
- **Streaming**: Chat uses SSE with JSON-encoded chunks
- **No regulated advice**: Coach gives guidance, not financial advice
