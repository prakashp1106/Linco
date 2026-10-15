# Sentinel Security Journal

## 2026-06-30 - Administrative Endpoint Key Authentication Pattern
**Vulnerability:** The `/api/config` POST endpoint allowed unauthenticated users to modify system-wide AI matching thresholds (`matchThreshold`), creating potential DoS or match distortion risk.
**Learning:** Endpoints modifying global application configuration must enforce key-based administrative authentication when `ADMIN_API_KEY` is configured in environment variables.
**Prevention:** Use `isAdminKeyValid()` utility helper to check `X-Admin-Key` header or `adminKey` request body parameter against `process.env.ADMIN_API_KEY`.
