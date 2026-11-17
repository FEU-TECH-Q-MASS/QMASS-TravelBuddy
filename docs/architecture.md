# TravelBuddy architecture

## Scope

TravelBuddy is a web travel planner. The approved structure follows SAVIRA-AXION's
separate `web/frontend` and `web/backend` applications. Mobile, `web/internal`, and
a dedicated NLP service are excluded. Gemini itinerary generation remains planned
as an external integration called by the Node.js backend.

## Implemented foundation

- Next.js App Router and React with JavaScript.
- Tailwind CSS 4 through `@tailwindcss/postcss` and `globals.css`.
- Express 5, a `/api/v1/health` endpoint, JSON errors, and configuration validation.
- Root npm workspaces with a single lockfile and shared development commands.
- Backend tests for configuration, health contract, and HTTP error handling.

Supabase PostgreSQL/Auth, Gemini, Amadeus, Google Maps, OpenWeather, and Nager.Date
are planned integrations. No account, saved-trip, import, caching, background-job,
or itinerary-generation implementation exists in this scaffold.

## Request flow

```text
Browser -> Next.js (localhost:3000)
             /api/* -> Express (localhost:5000)
                          -> services -> provider adapters (planned)
                          -> models -> Supabase PostgreSQL/Auth (planned)
```

The Next.js rewrite preserves the path, including `/api/v1`. Browser API requests
should use relative paths. Direct cross-origin browser access is not configured;
there is no permissive CORS policy. `BACKEND_URL` is server-only and is used when
Next.js builds its rewrites; rebuild after changing it for production.

## Responsibilities

| Directory | Responsibility |
| --- | --- |
| `frontend/src/app` | Next.js pages, layouts, and global Tailwind import |
| `frontend/src/components` | Reusable React components |
| `frontend/src/hooks` | Shared React hooks |
| `frontend/src/lib` | Client integrations and shared frontend configuration |
| `frontend/src/utils` | Pure frontend helpers |
| `backend/src/config` | Validated server configuration and future service clients |
| `backend/src/routes` | Versioned HTTP route registration |
| `backend/src/controllers` | Request/response handling |
| `backend/src/middleware` | Shared errors, future authentication and validation |
| `backend/src/services` | Travel workflows and budget calculations |
| `backend/src/services/providers` | External provider adapters |
| `backend/src/models` | Database access |
| `backend/migrations` | Versioned SQL schema and policies |
| `backend/tests` | Unit, integration, and contract checks |

## Rules for feature implementation

- Use camelCase for application functions/variables and PascalCase for components.
  Framework-required names such as `page.js` and `layout.js` take precedence.
- Keep public HTTP contracts under `/api/v1`; document breaking versions separately.
- Validate user inputs, provider responses, and Gemini output at runtime with Zod.
- Store credentials only server-side. A future browser Maps SDK needs a separate,
  restricted browser key; do not reuse the server or Gemini key.
- Delegate password hashing to Supabase Auth. Do not store decryptable passwords.
- Check saved-trip ownership in the backend and apply appropriate database RLS.
  A service-role client bypasses RLS, so it never replaces authorization checks.
- Calculate money deterministically using integer minor units or decimal arithmetic,
  with currency codes and explicit tax/fee inclusion. Do not invent exchange rates.
- Mark stale, unavailable, test, and historical data clearly. Respect provider terms
  before storing cached data. Weather availability depends on the forecast product.
- Holiday dates alone do not establish airport congestion or price forecasts.
- Treat 5-second provider timeouts, the 8-second request deadline, 15-second job
  target, 50 concurrent users, and 99.5% availability as proposed targets requiring
  design and verification. They are not implemented guarantees or provider SLAs.
- Long-running generation needs durable job execution and a status endpoint before
  it is deployed; a frontend request should not be held open indefinitely.

## Styling

Tailwind is the approved styling system. Define shared tokens in `@theme` in
`frontend/src/app/globals.css`. Tailwind 4 uses CSS-first configuration here;
there is no legacy `tailwind.config.js` or separate Autoprefixer setup.
Bootstrap, shadcn/ui, MUI, and Mantine are not installed.
