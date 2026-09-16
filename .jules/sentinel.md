## 2026-06-30 - Missing Administrative Authorization on POST /api/config
**Vulnerability:** The administrative configuration endpoint `POST /api/config` lacked authentication checks, allowing unauthenticated users to alter the global matching algorithm threshold (`matchThreshold`).
**Learning:** Admin endpoints operating without authentication checks create critical risks where unauthorized actors can modify system runtime configuration and matching criteria.
**Prevention:** Always validate `ADMIN_API_KEY` (via `X-Admin-Key` header or `adminKey` body parameter) when configured before executing administrative configuration state changes.
