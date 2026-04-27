# AI Road Trip Planner — RoamRoute

A comprehensive, AI-powered road trip planning web application that helps you plan the perfect journey with real GPS routing, smart stop suggestions, live trip tracking, and dynamic itinerary management.

---

## Features

### Planning & Routing
- **Multi-Step Planning Wizard** — Set your vehicle, crew size, route, and preferences in a guided flow
- **Real GPS Routing** — Actual driving distance and duration via OSRM; geocoding via Nominatim / OpenStreetMap
- **Smart Autocomplete** — Location search suggests real cities, towns, and landmarks as you type
- **Route Options** — Choose between Fastest, Scenic, or Balanced with real mileage for each

### AI-Powered Features
- **AI Recommendations** — Personalized attraction, restaurant, and activity suggestions powered by GPT
- **Must Visit Places** — AI-curated tab showing top en-route attractions and must-see spots at your destination, each with descriptions, visit time estimates, and practical tips
- **AI Music Playlists** — Mood-based road trip playlists in your chosen language (14 languages supported), with YouTube links and a "Play Full Playlist on YouTube Music" button
- **Late-Night Rest Stops** — When you depart between 8 PM and 6 AM, the app automatically detects night travel and suggests real motels, rest areas, and truck stops along your route with safety tips

### Trip Management
- **Interactive Map** — Full Leaflet map with your route, waypoints, and live GPS position
- **Live Trip Mode** — Real-time GPS tracking with approaching-stop alerts and browser notifications
- **Curated Stops & Meals** — Waypoints reverse-geocoded along your actual route; meals timed for breakfast, lunch, and dinner windows
- **Drag-to-Reorder Stops** — Rearrange your itinerary with drag and drop
- **Delay & Rerouting** — Running late? Shift your entire timeline and auto-swap closed venues
- **Nearby Places** — Discover fuel stations, restaurants, and attractions near your current location
- **Traffic Panel** — Live traffic conditions along your route
- **My Trips** — Save, load, and manage all your past road trips

### App Experience
- **How It Works** — In-app 8-step guide explaining every feature
- **Responsive Design** — Works on desktop and mobile screens
- **Dark-mode friendly** — Styled with Tailwind CSS tokens

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** — build tool and dev server
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — accessible component library
- **Leaflet** — interactive maps with OpenStreetMap tiles
- **Framer Motion** — animations
- **Zustand** — global state management
- **TanStack Query** — server state and caching
- **Wouter** — client-side routing
- **dnd-kit** — drag-and-drop stop reordering

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Drizzle ORM** + **PostgreSQL** — trip persistence
- **OSRM** — open-source real driving route calculation
- **Nominatim** — free geocoding and reverse geocoding (OpenStreetMap)
- **OpenAI GPT** — AI trip advisor, music playlists, must-visit places, rest stop suggestions

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL database
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/sharathankenapally/AI-Road-Trip-Planner.git
cd AI-Road-Trip-Planner

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL and OpenAI API key

# Run database migrations
pnpm --filter @workspace/db run migrate

# Start the development servers
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/road-trip-planner run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `PORT` | Port for the API server (default: 8080) |

---

## Project Structure

```
/
├── artifacts/
│   ├── road-trip-planner/          # React + Vite frontend
│   │   └── src/
│   │       ├── components/
│   │       │   ├── dashboard/      # Dashboard panels (Map, MustVisit, Music, Stops, etc.)
│   │       │   ├── layout/         # Navbar, HowItWorksDialog
│   │       │   └── wizard/         # Multi-step planning wizard
│   │       ├── pages/              # Dashboard, MyTrips, PlanTrip
│   │       ├── store/              # Zustand global state
│   │       └── utils/              # Time formatting and helpers
│   └── api-server/                 # Express backend
│       └── src/
│           ├── routes/
│           │   ├── ai.ts           # AI endpoints (recommendations, music, must-visit, rest-stops)
│           │   ├── trip.ts         # Trip planning and adjustment
│           │   └── trips.ts        # Saved trips CRUD
│           └── lib/                # Trip planner logic, OSRM, geocoding
└── lib/
    ├── api-zod/                    # Shared Zod schemas (request/response validation)
    ├── api-client-react/           # Generated React Query hooks
    └── db/                         # Drizzle schema and migrations
```

---

## API Endpoints

### Trip Planning
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/trip/plan` | Generate a full trip plan with stops, meals, and timing |
| `POST` | `/api/trip/adjust` | Adjust plan for delays and reroute if needed |

### AI Features
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/recommendations` | Get AI-curated attraction and activity suggestions |
| `POST` | `/api/ai/music` | Generate a language-specific AI playlist with YouTube links |
| `POST` | `/api/ai/must-visit` | Get must-visit places en-route and at the destination |
| `POST` | `/api/ai/rest-stops` | Get late-night motel and rest area suggestions |

### Saved Trips
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/trips` | List all saved trips |
| `POST` | `/api/trips` | Save a trip |
| `DELETE` | `/api/trips/:id` | Delete a saved trip |

---

## How It Works

1. **Vehicle Check** — Select traveler count and vehicle type
2. **Set Your Route** — Type start and destination with live place autocomplete
3. **Choose Route Type** — Fastest, Scenic, or Balanced with real mileage
4. **View Dashboard** — Full itinerary with map, must-visit places, stops, dining, and music tabs
5. **Must Visit** — Browse AI-curated attractions along your route and at your destination
6. **Late Night Alert** — If departing after 8 PM, get automatic motel and rest area suggestions
7. **Go Live** — Activate Live Trip mode for GPS tracking and stop alerts
8. **Music** — Generate a road trip playlist in any of 14 languages and open it in YouTube Music

---

## License

MIT License — free to use, modify, and distribute.
