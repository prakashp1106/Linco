## 2026-03-30 - Unauthenticated Configuration Update Endpoint
**Vulnerability:** The `POST /api/config` endpoint allowed any unauthenticated client to modify the global application matching threshold (`matchThreshold`).
**Learning:** System configuration endpoints exposed on the public API router must be protected with admin authorization (e.g. `X-Admin-Key` header matching `ADMIN_API_KEY`).
**Prevention:** Always enforce admin key or role authentication middleware on administrative configuration endpoints.
