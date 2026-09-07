# Sentinel Journal 🛡️

## 2026-06-30 - Administrative Endpoint Configuration Security
**Vulnerability:** The `POST /api/config` endpoint allowed unauthenticated clients to modify the global AI matching threshold (`matchThreshold`), creating a risk of unauthorized configuration tampering or Denial of Service (by setting threshold to 100% or 0%).
**Learning:** Administrative configuration endpoints without authorization checks allow public manipulation of system business logic thresholds.
**Prevention:** Always verify `ADMIN_API_KEY` (via `X-Admin-Key` header or `adminKey` body parameter) when `ADMIN_API_KEY` is configured in the server environment before processing configuration updates.
