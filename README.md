# Bayagra - Security Investigation & Threat Intelligence Platform

Bayagra is a production-grade incident investigation platform designed for security analysts and incident responders to analyze indicators of compromise (IOCs) such as phone numbers, IP addresses, domains, URLs, and text logs.

---

## 🛠 Features Included

### 1. Unified Dashboard
- Toggle between incident case files (pre-populated with demo case **INC-2026-0087**).
- Real-time incident logs, active alerts acknowledging, and case statistics counts.
- Dynamic data sync controls.

### 2. Network Geolocation Map
- Displays dynamic threat indicator paths on an interactive SVG world map projection.

### 3. Investigation Graph Layout
- Displays relationships (hosted on, registered to, contacted) between indicators in a node-based network schema.

### 4. Interactive Analytical Services
- **Phone Reputation Lookup**: Twilio carrier ranges, VoIP categorization, country code registry checks, and warning banners.
- **IP Reputation Check**: Tor consensus nodes, datacenter/hosting proxies, and abuse threat scores.
- **Domain & URL Audit**: DNS record sheets (MX, CNAME, A, TXT), SSL certificates statuses, WHOIS registration age, and typo-squatting brand alerts.
- **Syslog IOC Regex Parser**: Auto-extracts IP, IPv6, URLs, domains, emails, and hashes from raw log files.

### 5. Evidence Vault
- Browse files with browser-computed SHA-256 integrity checks, notes, and chain of custody logs.

### 6. AI Security Copilot
- Terminal dialogue interface evaluating the active database context for response playbooks.

### 7. Core Compliance & Audits
- Complete audit trails recording every lookup query, session state change, and document upload.
- JWT-based authentication supporting role hierarchies (`Admin`, `Security Analyst`, `Investigator`, `Viewer`).

---

## 🚀 Running the Platform

To start the platform, run the following commands in the workspace root:

1. **Install dependencies and setup backend virtual environment**:
   ```bash
   npm run setup
   ```
2. **Start both backend (Port 8000) and frontend (Port 3000) dev servers concurrently**:
   ```bash
   npm run dev
   ```
3. **Access the Client Dashboard**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔑 Login Access Credentials

| Username | Password | Role | Access Level |
|---|---|---|---|
| `admin` | `admin123` | **Admin** | Read, write, watchlist, delete cases, upload files |
| `analyst` | `analyst123` | **Security Analyst** | Read, write, watchlist, upload files |
| `investigator` | `investigator123` | **Investigator** | Read, write, watchlist |
| `viewer` | `viewer123` | **Viewer** | Read-only access |

---

## 📁 Architecture Layout

- `backend/`: FastAPI Python application.
  - `main.py`: Main routes entrypoint.
  - `core/`: Reputation checkers, transparent risk engines, and reports.
  - `tests/`: Automated unit tests.
- `frontend/`: Next.js 16 (App Router) client application.
  - `src/app/page.tsx`: Single Page Application Dashboard containing views.
  - `src/app/globals.css`: Premium cyber-themed visual design system.
