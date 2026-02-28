# Paving Charles - Operations Platform

## Project Overview
A React-based operations platform for a paving company ("Nationwide PA / Paving 123"). It provides dashboards for communications, project management, inventory tracking, fleet/crew management, financial operations, lead intelligence, analytics, and real-time push-to-talk radio with speech transcription and checklist intelligence.

## Tech Stack
- **Frontend**: React 18 + Vite 6
- **Backend**: Node.js + Express + Socket.IO (signaling server for WebRTC)
- **Database**: PostgreSQL (Replit-managed)
- **Real-time**: WebRTC peer-to-peer audio, Socket.IO signaling
- **Speech**: Browser SpeechRecognition API for live transcription
- **Mapping**: Leaflet / react-leaflet
- **Build**: Vite
- **Language**: JavaScript (JSX)

## Project Structure
```
/
├── index.html          # Entry HTML
├── vite.config.js      # Vite config (host: 0.0.0.0, port: 5000, proxy /socket.io + /api to 3001)
├── package.json        # Dependencies
├── server/
│   ├── index.js        # Express + Socket.IO signaling server (port 3001)
│   └── db.js           # PostgreSQL connection pool and query helpers
├── src/
│   ├── main.jsx        # React entry point
│   ├── App.jsx         # Main app (all views, contexts, sidebar, routing)
│   └── WalkieTalkie.jsx # Push-to-talk radio with transcription and comms log
└── public/
    └── vite.svg
```

## Database Schema
- **radio_logs**: id, channel, user_name, transcript, audio_duration_sec, created_at
- **checklist_actions**: id, radio_log_id (FK), project_id, action_type (add/complete), item_text, created_at

## Development
- **Start**: `node server/index.js & npm run dev` (backend on 3001, frontend on 5000)
- **Build**: `npm run build` (outputs to `dist/`)
- **Workflow**: "Start application" → `node server/index.js & npm run dev`

## Architecture
- **Frontend (port 5000)**: Vite dev server serves React app. Proxies `/socket.io` and `/api` to backend.
- **Backend (port 3001)**: Express + Socket.IO handles WebRTC signaling, transcript storage, and checklist intelligence. In production, also serves the built frontend from `dist/`.
- **WebRTC**: Peer-to-peer audio connections between users on the same channel.
- **Transcription**: Browser SpeechRecognition runs during PTT, transcripts are sent to server and stored in PostgreSQL.
- **Checklist Intelligence**: Server detects completion/problem phrases in transcripts and suggests checklist actions to users.

## Deployment
- Deployment target: autoscale
- Build command: `npm run build`
- Run command: `node server/index.js`
- Server binds to 0.0.0.0, uses PORT env var (fallback 3001)

## Features
- Navigation sidebar with: Home, Command Center, Comms Hub, **Radio**, Job Board, Project Map, Financial Ops, Materials, Fleet & Crew, Analytics, Knowledge Base, Lead Intel, Integrations
- Dark/light theme toggle
- Font size controls (A-, 100%, A+) using CSS zoom
- Fuzzy natural language command matching for voice/text navigation
- Voice assistant FAB (floating action button)
- Push-to-talk radio FAB (floating, available on all pages except Radio view)
- Walkie-talkie channels: Alpha Crew, Bravo Crew, Management, All Hands
- Live speech-to-text transcription during PTT
- Comms log showing all channel transcripts with timestamps
- Checklist suggestions: auto-detected from radio transcripts (completion/problem phrases)
- Toast notifications for checklist actions triggered via radio

## API Endpoints
- `GET /api/radio-logs?channel=X&limit=N` — Fetch recent transcripts for a channel
- `GET /health` — Server health check

## Socket Events
- `join-channel`, `leave-channel` — Channel presence
- `signal` — WebRTC signaling relay
- `talking-start`, `talking-stop` — PTT state
- `radio-transcript` — Send transcript to server for storage and analysis
- `transcript` — Broadcast transcript to channel
- `checklist-suggestion` — Server suggests a checklist action
- `checklist-confirm` — Client confirms a checklist action
- `checklist-action-confirmed` — Broadcast confirmed action

## Notes
- Business data (projects, inventory, etc.) is mock/local state
- The walkie-talkie feature requires microphone permissions and a browser that supports SpeechRecognition (Chrome, Edge)
- `src/App.jsx` is a large single file (~3900+ lines) containing all views and components
- User preference: app should make best-guess navigation, never dictate phrasing to users
