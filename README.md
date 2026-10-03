# Chrono AI — AI-Assisted Appointment Booking SaaS

A modern full-stack web application featuring an AI-powered conversational appointment booking concierge, real-time schedule conflict prevention, multi-tenant business support, and complete appointment management.

---

## 🏛 High-Level Architecture

The system is designed with strict separation of concerns, robust security boundaries, and modular full-stack architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend (React 19 + Vite)                      │
│  - Monochromatic Black & White Theme                                   │
│  - Modular Component Architecture (Sidebar, ChatView, BookingModal)    │
│  - Real-time Socket.io Client & Live Slot Availability Checker         │
│  - Conversational AI with Form Fallback Integration                   │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │ HTTP (Axios)                   │ WebSockets (Socket.io)
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Backend (Node.js + Express)                       │
│  - Morgan HTTP Request Logger                                          │
│  - Tiered Rate Limiters (General API, Auth Brute-Force, Booking)       │
│  - Request Validation Middleware (Sanitization, Regex, Type Checks)    │
│  - Tenant-Scoped Date Conflict Detection Engine                        │
│  - Database-Backed AI Interaction Observability (`ai_logs`)            │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │                                │
           PostgreSQL (Supabase)               AI Service (Groq API)
           - businesses (Multi-Tenancy)        - Multi-Model Fallback Chain
           - users (JWT Auth)                  - 14-Day Dynamic Calendar
           - chat_sessions (JSONB History)     - Timezone Offset Preservation
           - appointments (B-Tree Indexed)     - Incomplete Input Detection
           - ai_logs (Latency & Metrics)
```

### Tech Stack
* **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Socket.io Client, Axios.
* **Backend**: Node.js, Express, Socket.io, JSONWebToken, Morgan, Express-Rate-Limit.
* **Database**: PostgreSQL (Supabase pooler) with relational foreign keys, B-Tree indexes, and JSONB history.
* **AI Provider**: Groq API with automatic multi-model fallback chain (`openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`).

---

## ⚡ Core Deliverables & Features

### 1. AI-Assisted Conversational Booking
- Natural language understanding for appointment booking (e.g., *"Book a Dental Checkup for next Monday at 2:00 PM"*).
- **Dynamic 14-Day Reference Calendar**: Injected dynamically into system prompt to eliminate LLM date reasoning errors.
- **Timezone Offset Preservation**: Client passes browser timezone offset (e.g., `+05:00`) ensuring local hours remain exact.
- **Structured Form Fallback**: When user input is ambiguous or incomplete, the assistant replies conversationally AND offers an interactive **"Open Booking Form"** button directly inside the chat.
- **Friendly Conversational Receipts**: Raw JSON is safely intercepted on both backend and frontend—users only see natural confirmations.

### 2. Multi-Tenant Business Architecture
- **Tenant Isolation**: Multiple businesses (e.g. *Acme Dental Clinic*, *Apex Health & Wellness*, *Mind Therapy Studio*) maintain independent calendars and service catalogs.
- **Interactive Business Switcher**: Users can switch providers seamlessly from the sidebar.
- **Tenant-Scoped Schedules**: A 2:00 PM reservation at *Acme Dental* does not block 2:00 PM at *Apex Health*.

### 3. Schedule Conflict Prevention
- Checks PostgreSQL for existing non-cancelled overlapping slots before booking.
- Returns **HTTP 409 Conflict** with: *"This date and time is already booked for this business. Please select another date."*
- Verified in both the WebSocket AI flow and REST `POST /api/appointments`.

### 4. Direct Booking & Real-Time Availability Checker
- Form-based scheduling with debounced real-time slot verification (`GET /api/appointments/check`).
- Dynamic status banners: checking spinner, "Date Already Booked" warning, or "Slot Available" confirmation.

### 5. Proper Loading States & Modern B&W Design
- Animated spinning loaders on all submit actions (Login, Registration, Direct Booking, Cancellation).
- Pulsing 3-dot typing indicator while the AI analyzes the schedule.
- Shimmering skeleton cards when fetching appointments.
- High-contrast, minimalist monochromatic aesthetic (Vercel/Linear style).

### 6. Security, Middleware & Observability
- **Request Validation**: Sanitization and field validation for registration, login, and appointment booking.
- **Logging**: Morgan HTTP logger records timestamp, method, route, status code, response time, and IP.
- **Rate Limiting**:
  - General API: 120 requests / 15 mins.
  - Auth Endpoints (`/api/auth/*`): 15 attempts / 15 mins (brute-force defense).
  - Appointment Creation (`/api/appointments`): 30 requests / 15 mins.
- **AI Observability (`ai_logs` Table)**: Persists user message, AI output, model used, latency in ms, and action type for analytics.

---

## 📁 Modular Frontend Structure

```
frontend/src/
├── components/
│   ├── Sidebar.jsx            # Multi-tenant switcher, navigation tabs, mini-reservations preview, user profile
│   ├── ChatView.jsx           # AI chat header, message feed, typing indicator, quick prompt chips, input bar
│   ├── ChatMessage.jsx        # User bubbles, assistant cards, confirmation receipts, and form fallback button
│   ├── AppointmentsView.jsx   # Appointments list with business badges, status pills, and cancellation spinners
│   ├── OccupiedSlotsView.jsx  # Tenant calendar overview displaying occupied slots for the selected business
│   └── BookingModal.jsx       # Direct appointment booking modal with service selection and live availability check
└── pages/
    ├── Login.jsx              # High-contrast B&W authentication with loading states
    └── Chat.jsx               # Orchestrator coordinating state, WebSockets, multi-tenancy, and APIs
```

---

## 🚀 How to Run Locally

### Prerequisites
* Node.js v18+ installed
* PostgreSQL database instance (or Supabase URL)
* Groq API Key

### 1. Clone & Setup Environment
Create `.env` in `backend/.env`:
```env
PORT=8000
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
GROQ_API_KEY=gsk_your_groq_api_key_here
JWT_SECRET=your_super_secret_jwt_key
```

Create `.env` in `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SOCKET_URL=http://localhost:8000
```

### 2. Install Dependencies & Seed Database
```bash
# Install backend packages
cd backend
npm install

# Run database setup & seeds
node -r dotenv/config src/db/seedBusinesses.js
node -r dotenv/config src/db/migrateAiLogs.js

# Install frontend packages
cd ../frontend
npm install
```

### 3. Start Development Servers
From root directory:
```bash
# Terminal 1: Start Backend (Port 8000)
npm run dev:backend

# Terminal 2: Start Frontend (Port 5173)
npm run dev:frontend
```
Open **`http://localhost:5173`** in your browser.

---

## 📐 Key Design Decisions & Tradeoffs

| Decision | Rationale | Tradeoff |
| :--- | :--- | :--- |
| **WebSockets (Socket.io) for Chat** | Enables instant, low-latency multi-turn conversations and typing indicators without client polling overhead. | Requires persistent server connections compared to stateless REST. |
| **Server-Side Slot Collision Detection** | Checking the database in both WebSocket and REST endpoints guarantees no race condition or double-booking can occur. | Minor additional query before emitting booking events. |
| **Dynamic 14-Day Reference Calendar for AI** | LLMs struggle with relative date calculations (e.g. "next Monday"). Providing a precomputed calendar table ensures 100% calendar accuracy. | Slightly increases prompt token count by ~120 tokens. |
| **JSONB for Chat Session Storage** | Storing session messages as an array of JSONB objects inside `chat_sessions` provides instant session retrieval in a single query. | Appending large chat sessions over hundreds of messages requires periodic pagination or archiving. |
| **Client Timezone Offset Passing** | Passing `tz_offset` (e.g., `+05:00`) preserves the exact user-intended time when converting to UTC in PostgreSQL. | Client must send their browser timezone offset upon connection/message. |
| **Database AI Observability (`ai_logs`)** | Storing model name, prompt latency, and user queries provides immediate debugging insight and performance tracking. | Small async insert overhead per AI interaction. |

---

## 🔍 Assumptions & Known Limitations

1. **Fixed Appointment Duration**: Default durations are 30 to 60 minutes based on the service selected. Variable custom durations can be configured in future iterations.
2. **Business Calendar**: Current implementation checks slot collisions across the selected business tenant.
3. **External Calendar Sync**: Google Calendar / Outlook sync is not currently wired; the system operates on the internal PostgreSQL appointment schedule.
