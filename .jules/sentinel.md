## 2026-03-31 - Unauthenticated Admin Config Endpoint
**Vulnerability:** The `POST /api/config` endpoint allowed unauthenticated clients to modify system-wide AI match thresholds.
**Learning:** Administrative endpoints controlling global configuration must mandate authentication headers and timing-safe token validation.
**Prevention:** Validate administrative credentials via `validateAdminApiKey` in `src/utils/security.ts` using constant-time comparison before modifying server state.
