## 2026-06-30 - Admin Config Endpoint Missing Authentication
**Vulnerability:** Unauthenticated `POST /api/config` allowed arbitrary modification of system-wide AI matching threshold `matchThreshold`.
**Learning:** Administrative API endpoints for global parameters were missing key verification when `ADMIN_API_KEY` environment variable was configured.
**Prevention:** Always enforce timing-safe API key or token checks on administrative configuration endpoints.
