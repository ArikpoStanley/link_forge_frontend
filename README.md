# Fuspay TransID — Modular KYC Link Portal

Independent Next.js app for external users to hit the Modular KYC backend, generate a verification link, then either:

1. **Verify inline** — KYC runs in a modal (initializing screen → full flow in an iframe)
2. **Open verification link** — normal hosted KYC experience in a new tab

## Setup

```bash
cd kyc-link-portal
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Example | Notes |
|----------|---------|--------|
| `KYC_API_BASE_URL` | `http://localhost:8010/api/v1/modular` | Or production `https://kyc-verif-new.fly.dev/api/v1/modular` |
| `KYC_APP_ID` | Mongo `Apps` ObjectId | Required — active Modular KYC app |
| `KYC_FRONTEND_URL` | `http://localhost:8009` | Expo KYC web app URL |
| `KYC_DEFAULT_CALLBACK_URL` | webhook URL | Used when form callback is empty |

### Get a local app id

With the backend running in `dev`:

```bash
curl -X POST http://localhost:8010/api/v1/modular/dev/bootstrap
```

Then in Mongo:

```js
db.apps.findOne({ name: "local-dev-app" }, { _id: 1 })
```

Paste that `_id` into `KYC_APP_ID`.

## Run

```bash
# Terminal 1 — KYC backend
cd ../KYC_Verif && npm run dev

# Terminal 2 — KYC frontend (Expo web)
cd ../modular-kyc-frontend && npm run web

# Terminal 3 — this portal
cd ../kyc-link-portal && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flow

```
Portal form
  → POST /api/generate (server)
    → POST {KYC_API}/user
    → POST {KYC_API}/verification
  → Show link + two options
    → Inline: modal → initializing → iframe(verification_url)
    → External: open verification_url in new tab
```

Inline mode polls `GET /api/status/:id` and shows a completion overlay when the session status is `completed`.

## Notes

- Camera / liveness needs `allow="camera; microphone"` on the iframe (already set).
- Some browsers block third-party camera in cross-origin iframes — use “Open verification link” if liveness fails inline.
- `KYC_APP_ID` stays server-side; the browser only talks to this Next.js app.
