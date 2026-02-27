# Paving 123 — Operations Platform

A comprehensive operations management platform built for **Paving 123**, a Midwest paving company specializing in small-to-midsize residential and commercial projects.

## Modules

### Primary Operations
- **Dashboard** — Real-time KPIs: active projects, crew status, fleet activity, inventory alerts, and top leads
- **Communications Portal** — Channel-based crew messaging with auto-detection that syncs task confirmations to project checklists. All conversations are logged and management-reviewable
- **Project Management** — Interactive checklists, project timelines with photo/video documentation, budget tracking, and per-task attribution
- **Inventory Management** — Materials, tools, equipment, and safety gear tracking with low-stock alerts and category filtering
- **Fleet & Crew Tracking** — Live map visualization with vehicle status (on-site, in-transit, idle, maintenance), fuel levels, and employee roster

### Lead Intelligence
- **Bond Scanner** — Monitors municipal and state bond issuances for road/infrastructure allocations
- **RFP Tracker** — Scrapes procurement portals for paving-related requests for proposals
- **Permit Monitor** — Watches building permit filings for driveway, road, and parking lot work
- Each lead includes relevance scoring, recommended actions, deadline tracking, and source attribution

## Tech Stack

- **React 18** + **Vite 6**
- Custom component library (no external UI framework)
- CSS-in-JS styling

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
paving-charles/
├── public/
│   └── vite.svg            # Favicon
├── src/
│   ├── App.jsx             # Main application (all modules)
│   └── main.jsx            # React entry point
├── index.html              # HTML entry
├── package.json
├── vite.config.js
└── README.md
```

## Roadmap

- [ ] Real-time WebSocket messaging with push notifications
- [ ] AI-powered message parsing for auto-completing project checklist tasks
- [ ] GPS integration (Google Maps / Mapbox) for live vehicle tracking
- [ ] Photo/video upload with cloud storage for project timelines
- [ ] Automated web scrapers for EMMA/MSRB bond databases, permit portals, and procurement sites
- [ ] Role-based access control (crew vs. management views)
- [ ] Estimating/bidding tools with material cost calculators
- [ ] Weather API integration for scheduling
- [ ] Customer-facing project status portal
- [ ] Mobile-responsive PWA

## License

Private — Paving 123
