# Sentinel Security Journal

## 2026-03-05 - Fail-Closed Administrative API Key Validation
**Vulnerability:** Unauthenticated modification of system configuration via `POST /api/config`.
**Learning:** Defaulting key validation to `true` when server environment variables are unconfigured creates a fail-open condition where attackers can freely modify settings.
**Prevention:** Always fail closed (`return false`) when expected secret/key environment variables are missing or unconfigured on administrative endpoints.
