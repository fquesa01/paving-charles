# Paving Charles - Operations Platform

## Project Overview
A React-based operations platform for a paving company ("Nationwide PA / Paving 123"). It provides dashboards for communications, project management, inventory tracking, fleet/crew management, financial operations, lead intelligence, and analytics.

## Tech Stack
- **Frontend**: React 18 + Vite 6
- **Mapping**: Leaflet / react-leaflet
- **Build**: Vite (static site)
- **Language**: JavaScript (JSX)

## Project Structure
```
/
├── index.html          # Entry HTML
├── vite.config.js      # Vite config (host: 0.0.0.0, port: 5000)
├── package.json        # Dependencies
├── src/
│   ├── main.jsx        # React entry point
│   └── App.jsx         # Main app (all components in one file)
└── public/
    └── vite.svg
```

## Development
- **Start**: `npm run dev` (runs on 0.0.0.0:5000)
- **Build**: `npm run build` (outputs to `dist/`)
- **Workflow**: "Start application" → `npm run dev`

## Deployment
- Target: Static site
- Build command: `npm run build`
- Public directory: `dist`

## Notes
- All data is mock/local state (no backend or database)
- The app has a full navigation sidebar with: Home, Command Center, Comms Hub, Job Board, Project Map, Financial Ops, Materials, Fleet & Crew, Analytics, Knowledge Base, Lead Intel, Integrations
- Dark/light theme toggle included
