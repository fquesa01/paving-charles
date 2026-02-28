# Paving Charles - Operations Platform

## Project Overview
A React-based operations platform for a paving company ("Nationwide PA / Paving 123"). It provides dashboards for communications, project management, inventory tracking, fleet/crew management, financial operations, lead intelligence, analytics, and real-time push-to-talk radio.

## Tech Stack
- **Frontend**: React 18 + Vite 6
- **Backend**: Node.js + Express + Socket.IO (signaling server for WebRTC)
- **Real-time**: WebRTC peer-to-peer audio, Socket.IO signaling
- **Mapping**: Leaflet / react-leaflet
- **Build**: Vite
- **Language**: JavaScript (JSX)

## Project Structure
```
/
├── index.html          # Entry HTML
├── vite.config.js      # Vite config (host: 0.0.0.0, port: 5000, proxy /socket.io to 3001)
├── package.json        # Dependencies
├── server/
│   └── index.js        # Express + Socket.IO signaling server (port 3001)
├── src/
│   ├── main.jsx        # React entry point
│   ├── App.jsx         # Main app (all views, contexts, sidebar, routing)
│   └── WalkieTalkie.jsx # Push-to-talk radio component (WebRTC + Socket.IO)
└── public/
    └── vite.svg
```

## Development
- **Start**: `node server/index.js & npm run dev` (backend on 3001, frontend on 5000)
- **Build**: `npm run build` (outputs to `dist/`)
- **Workflow**: "Start application" → `node server/index.js & npm run dev`

## Architecture
- **Frontend (port 5000)**: Vite dev server serves React app. Proxies `/socket.io` to backend.
- **Backend (port 3001)**: Express + Socket.IO handles WebRTC signaling for walkie-talkie channels. No database — all state is in-memory.
- **WebRTC**: Peer-to-peer audio connections between users on the same channel. Backend only relays signaling (offers, answers, ICE candidates) and presence info.

## Deployment
- Now requires autoscale deployment (not static) due to the backend server
- Build command: `npm run build`
- Run command: `node server/index.js`

## Features
- Navigation sidebar with: Home, Command Center, Comms Hub, **Radio**, Job Board, Project Map, Financial Ops, Materials, Fleet & Crew, Analytics, Knowledge Base, Lead Intel, Integrations
- Dark/light theme toggle
- Font size controls (A-, 100%, A+) using CSS zoom
- Fuzzy natural language command matching for voice/text navigation
- Voice assistant FAB (floating action button)
- Push-to-talk radio FAB (floating, available on all pages except Radio view)
- Walkie-talkie channels: Alpha Crew, Bravo Crew, Management, All Hands

## Notes
- All business data is mock/local state (no backend database)
- The walkie-talkie feature requires microphone permissions
- `src/App.jsx` is a large single file (~3800+ lines) containing all views and components
- User preference: app should make best-guess navigation, never dictate phrasing to users
