# Sentinel Journal

## 2026-03-31 - Admin API Key Authentication on Configuration Endpoint
**Vulnerability:** The administrative endpoint `POST /api/config` allowed unauthenticated users to modify system-wide match threshold configuration (`matchThreshold`).
**Learning:** Administrative endpoints controlling algorithm parameters require strict authentication when `ADMIN_API_KEY` environment variable is configured.
**Prevention:** Always enforce API key or session authorization checks on non-GET administrative endpoints.
