# TravelBuddy — Q-MASS

TravelBuddy is a web travel planner designed to combine a traveler's destination,
dates, interests, and budget with flight, hotel, maps, weather, and holiday data
to produce a personalized itinerary.

**Status: working local MVP.** The public pages include destination browsing and
trip preference previews. The local API now supports authentication, owned saved
trips, itinerary workspaces, transport guidance, demo hotel offers, budgets, routes,
conditions, notifications, preferences, and admin user management. Provider data
is clearly labeled demo data and is stored in memory; production persistence,
password hashing, email delivery, AI generation, and live provider integrations
remain follow-up work.

## Technology stack

| Layer | Technology |
| --- | --- |
| Web interface | Next.js App Router + React, JavaScript |
| Styling | Tailwind CSS 4 with its PostCSS plugin |
| Interface icons | React Icons (`react-icons/fi`, Feather set) |
| API | Node.js + Express 5, CommonJS |
| Runtime validation | Zod |
| Database and authentication | Supabase Auth for accounts; trip/provider persistence remains local MVP |
| AI itinerary generation | Google Gemini API (planned) |
| Flights and hotels | Route guidance with date-specific flight search links and demo hotel offers. Live inventory planned. |
| Places and travel routes | Google Maps APIs (planned) |
| Weather | OpenWeather API (planned) |
| Public holidays | Nager.Date API (planned) |
| Tooling | npm workspaces, ESLint, Node.js test runner, concurrently |

The layout follows SAVIRA-AXION's frontend/backend organization. This project has
**no mobile application, internal web portal, or dedicated NLP service**.
Tailwind replaces the Bootstrap styling proposed in the initial audit. No extra
UI component library is installed.

## Requirements

- Node.js **24 LTS** and npm **11 or later**. Use the same Node major across the team.
- Git.
- Provider accounts are only needed when implementing the corresponding features.
  The scaffold starts without API keys or a database.

## Quick start

Run all npm commands from the repository root:

```powershell
npm ci
Copy-Item web/frontend/.env.example web/frontend/.env.local
Copy-Item web/backend/.env.example web/backend/.env
npm run dev
```

Copy the example environment files once; do not overwrite existing local settings.
For the first dependency resolution, or after intentionally changing dependencies,
use `npm install` and commit the root `package-lock.json`. For normal setup use
`npm ci`. Do not maintain lockfiles inside the workspace packages.

- Frontend: <http://localhost:3000>
- API directly: <http://localhost:5000/api/v1/health>
- API through the frontend: <http://localhost:3000/api/v1/health>

Stop development with `Ctrl+C`. The root command runs both services together.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the frontend and backend with development reload |
| `npm run dev:web` | Alias for the combined development command |
| `npm run dev:frontend` | Start Next.js only on port 3000 |
| `npm run dev:backend` | Start Express only on port 5000 |
| `npm run lint` | Lint both applications |
| `npm test` | Run frontend trip-validation and backend unit, integration, and contract tests |
| `npm run build` | Build the production frontend |
| `npm start` | Run the built frontend and backend together |

Run `npm run build` before `npm start`. Production hosting must provide environment
variables, HTTPS, and process management. No hosting service is provisioned here.

## File structure

```text
QMASS-TravelBuddy/
├── docs/
│   ├── api/README.md
│   └── architecture.md
├── tools/
├── web/
│   ├── package.json
│   ├── frontend/
│   │   ├── public/images/
│   │   ├── src/
│   │   │   ├── app/           # Direct routes: about/, login/, explore/[slug]/, etc.
│   │   │   ├── components/    # Shared components, including Icon.js and AuthForm.js
│   │   │   │   └── layout/    # Navbar.js, Footer.js, Logo.js
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── utils/
│   │   ├── .env.example
│   │   ├── next.config.mjs
│   │   ├── postcss.config.mjs
│   │   └── package.json
│   └── backend/
│       ├── migrations/
│       ├── scripts/
│       ├── src/
│       │   ├── config/
│       │   ├── controllers/
│       │   ├── middleware/
│       │   ├── models/
│       │   ├── routes/
│       │   ├── services/providers/
│       │   ├── utils/
│       │   ├── app.js
│       │   └── index.js
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── contract/
│       ├── .env.example
│       └── package.json
├── .gitignore
├── package.json
├── package-lock.json
├── LICENSE
└── readme.md
```

Some directories contain `.gitkeep` files so the approved structure is retained
in Git until feature code is added. The original empty HTML/CSS/JS starter was
removed. Current TravelBuddy branding and local travel photographs are under
`web/frontend/public/images`. See [image credits](docs/image-credits.md).

## Public pages and local preview

Once dependencies are installed, run `npm run dev` and open
<http://localhost:3000>. If a server is already running there, use it; do not launch
a second copy. The terminal prints the actual URL if another application uses 3000.
No provider keys are required to view or interact with the public website.

| Route | Experience |
| --- | --- |
| `/` | Landing page, trip preferences, summary preview, sample itinerary, FAQ |
| `/explore` | Destination browsing with region, interest, and text filters |
| `/explore/palawan` | Palawan guide with separate Puerto Princesa, Coron, and El Nido trip bases |
| `/how-it-works` | Planning steps, planned data inputs, sample itinerary, FAQ |
| `/about` | Project context, principles, and Q-MASS team |
| `/contact` | Validated contact form that sends messages to the admin inbox |
| `/admin/support-messages` | Admin inbox with filters, resolution, archiving, and restore |
| `/login` | Login interface with an inline Sign Up link |
| `/signup` | Signup interface with validation and password guidance |
| `/forgot-password` | Password-recovery interface preview |
| `/dashboard` | Signed-in dashboard and saved trips |
| `/trips/:id` | Itinerary, transport, hotels, budget, routes, and conditions workspace |
| `/account` | Profile and travel preferences |
| `/notifications` | In-app notification list |
| `/admin/users` | Admin account and role management |

The desktop navbar contains Home, Explore, How It Works, About, Contact, and Log In.
Sign Up is linked inside Login, not shown as a separate navbar action. Mobile uses
a collapsible menu with the same links. Logo and favicon use the existing branding.

The public trip preview validates future dates, counts days/nights, and summarizes
the total budget, currency, travelers, interests, and airfare preference. Signed-in
users can use the homepage planner to generate and save a local demo trip. Create accounts
through the configured Supabase Auth signup screen.

`npm test` runs frontend trip-validation tests plus the existing backend checks.
`npm run lint` and `npm run build` check both code quality and production compilation.
All routes live directly under `src/app`, such as `src/app/about/page.js`,
`src/app/login/page.js`, and `src/app/explore/[slug]/page.js`. The root layout
provides the navbar, main-content wrapper, and footer for every page. Shared
components live directly in `src/components`, with navbar, footer, and logo retained
in `src/components/layout`.

## Environment and security

| Setting | Location | Purpose |
| --- | --- | --- |
| `BACKEND_URL` | Frontend `.env.local` | Server-only `/api/*` proxy target; defaults to `http://localhost:5000` |
| `PORT` | Backend `.env` | API port; defaults to 5000 |
| `NODE_ENV` | Backend environment | `development`, `test`, or `production` |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Backend `.env` | Server-side token verification and profile authorization |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Frontend `.env.local` | Browser Supabase Auth client |

For local development, Next.js forwards `/api/*` to Express, preserving `/api/v1`.
If the local backend port changes, update `BACKEND_URL` too. Browser code should
call relative `/api/v1/...` paths.

Keep `.env` files and provider secrets out of Git and browser bundles. Never put
Gemini, Amadeus, server Maps, or Supabase service-role keys in `NEXT_PUBLIC_*`.
The local API includes `/api/v1/me`, `/api/v1/trips`, `/api/v1/notifications`,
and `/api/v1/admin` in addition to health. Supabase Auth verifies bearer tokens;
profile roles and active status are checked server-side before protected access.

## Deploy to one Vercel project

Import the repository as `qmass-travelbuddy`. Use the repository root as the
Root Directory, select **Services** as the Framework Preset, and use **Node.js
24.x**. The root `vercel.json` routes `/api/*` to Express and other requests to
Next.js on the same domain. Leave `BACKEND_URL` unset for this deployment.

Add the following in the project's **Environment Variables** for Production.
Add values for Preview as well if you plan to test a preview deployment.

| Setting | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for browser authentication |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key for that Supabase project |
| `SUPABASE_URL` | The same Supabase project URL for Express |
| `SUPABASE_SECRET_KEY` | Server-side key for that Supabase project. Store as a Secret. |
| `GOOGLE_MAPS_SERVER_API_KEY` | Server-side key restricted to Routes API; never expose as `NEXT_PUBLIC_*` |
| `GEMINI_API_KEY` | Optional Secret for AI-generated itineraries and travel suggestions |
| `OPENWEATHER_API_KEY` | Optional Secret for live weather |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional browser key for live route maps |

Open `/` and `/api/v1/health` on the deployed domain to verify both services.
Set the Supabase Auth Site URL to the production domain and allow its
`/reset-password` redirect.

Automatic price checks need a scheduler and persistent storage to run reliably on
Vercel. The local Express process starts the timer, and price trackers and
notifications currently live in memory.

## Development conventions

- Keep frontend rendering in React; keep provider credentials, orchestration,
  budget calculations, and database access in Express.
- Use Tailwind utilities and shared `@theme` tokens in `src/app/globals.css`.
  Tailwind 4 does not require a `tailwind.config.js` in this setup.
- Use camelCase application identifiers and PascalCase React components, while
  retaining framework-required filenames such as `page.js` and `layout.js`.
- Add versioned contracts under `/api/v1` and tests for new behavior.
- Validate provider responses and AI output. Label stale/test/estimated data and
  respect provider caching policies; do not present estimates as confirmed prices.

## Documentation

- [Architecture, responsibilities, and implementation rules](docs/architecture.md)
- [Current API contract](docs/api/README.md)
- [Provider adapter responsibilities](web/backend/src/services/providers/README.md)
- Official guides: [Next.js](https://nextjs.org/docs),
  [Tailwind with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs),
  [Express](https://expressjs.com/), [Supabase](https://supabase.com/docs).

## Project team

Alexa Mhel V. Gagan, Michaela Marie V. Gonzales, Quervie B. Manrique,
Shane D. Oxina, and Sean Peji — TW41, FEU Institute of Technology.

## License

The existing [GNU General Public License v3](LICENSE) is retained.
