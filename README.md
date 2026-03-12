# Cal.com Clone — Scheduling Platform

A full-stack scheduling/booking web application built for the **Scaler SDE Intern Fullstack Assignment**. It closely replicates Cal.com's design, UX, and core functionality.

## 🚀 Live Demo
- **Frontend / Booking Public Page:** [Insert Deployed Vercel/Netlify URL Here]
- **Backend API Docs:** [Insert Deployed Render/Railway URL Here]/docs

---

## 🛠 Tech Stack

- **Frontend:** React.js (Vite), native CSS variables for theme mapping to match Cal.com aesthetics. 
- **Backend:** Python with FastAPI (chosen for rapid async development and native Pydantic validation).
- **Database:** PostgreSQL (hosted on Supabase) accessed via SQLAlchemy ORM.

---

## ⚙️ Setup Instructions

### 1. Database Configuration
The application is pre-configured to point to a cloud PostgreSQL database. However, if you wish to run it locally:
```bash
# Create the local database
createdb calclone
# Or using psql:
# psql -U postgres -c "CREATE DATABASE calclone;"
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure Environment Variables
# Create a .env file based on the default configuration expected by app/config.py
# Example: DATABASE_URL="postgresql://user:pass@localhost:5432/calclone"

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```
*API docs will be available at: http://localhost:8000/docs*

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*App will be available at: http://localhost:5173*

---

## ✨ Features Implemented

### Core Requirements
- **Event Types Management** — Create, edit, delete, toggle active/inactive, copy booking link.
- **Availability Settings** — Weekly inline schedule editor, timezone selection, multiple schedules.
- **Public Booking Page** — Dynamic calendar view, exact time slot generation based on buffer/duration boundaries, booking form with conflict validation.
- **Bookings Dashboard** — Upcoming/past/cancelled tabs, detailed weekly calendar grid view, cancellation functionality.

### Bonus Features Completed
- ✅ **Responsive Design** — Fully mobile-friendly across all dashboards.
- ✅ **Date Overrides** — Ability to block specific dates or set custom hours overriding the weekly schedule.
- ✅ **Rescheduling Flow** — Existing bookings can be rescheduled.
- ✅ **Real Email Notifications** — The backend natively sends actual SMTP confirmation emails instead of console logging.
- ✅ **Buffer Time** — Accounts for buffer time before/after meetings to prevent back-to-back burnout.
- ✅ **Custom Booking Questions** — Stores custom responses dynamically.

---

## 🧠 Architecture & Database Design
The application adheres strictly to SOLID principles, leveraging Python's dependency injection mechanisms and layered architecture:
- **Routers**: Thin API controllers holding no business logic.
- **Services**: Core calculation and business logic (e.g., Slot Generation Strategy based on timezone arithmetic).
- **Repositories**: Isolated data access layer handling SQLAlchemy execution.

**Key Database Entities:**
- `User`: Handles timezone and schedule metadata.
- `EventType`: Holds slug, title, duration, buffer times. 
- `Availability`: JSON/structured mapping of Days to Array of Time ranges + Date Overrides.
- `Booking`: Ties it all together, holding start/end times precisely aligned to UTC timestamps.

---

## 📝 Technical Assumptions & Implementation Details

1.  **Identity & Authentication**: Following the project's "No Login Required" design, the platform operates under a single-tenant assumption. A default admin user (`vinith`) is used to anchor all availability schedules and event types.
2.  **Date Override Precedence**: Date-specific overrides (e.g., specific holidays or custom hours) take absolute precedence over the recurring weekly schedule. If a date is marked as "Blocked" in overrides, all weekly slots are suppressed for that day.
3.  **Conflict & Buffer Logic**: A time slot is only generated if the entire duration *and* its associated "Buffer Before" and "Buffer After" windows are free. Buffers are treated as non-overlapping "protective padding" around meetings.
4.  **Recurring Series Handling**: To match high-end scheduling behavior:
    - If the **first** requested slot in a recurring series is unavailable, the system returns a conflict error (409).
    - For **subsequent** occurrences, the system automatically skips over conflicting dates while successfully booking the available ones, ensuring the user gets as much of their series as possible.
5.  **Timezone Integrity**: Availability is defined in the host's preferred timezone. The backend performs all slot calculations by projecting these boundaries into UTC, ensuring that bookers from different timezones always see accurate, non-conflicting times.
6.  **Fail-safe Notifications**: SMTP email delivery is tightly integrated but defensively implemented. If the mail server is unreachable or credentials fail, the system logs the error and proceeds with the booking to prevent a degraded user experience.
