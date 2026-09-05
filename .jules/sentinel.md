## 2026-09-05 - Environment Variable Administrative Endpoint Protection
**Vulnerability:** Unauthenticated `POST /api/config` allowed arbitrary modification of system match thresholds.
**Learning:** Administrative endpoints need explicit key validation checks against environment variables (`ADMIN_API_KEY`) to prevent unauthorized system setting alterations.
**Prevention:** Always validate authorization headers (`X-Admin-Key`) or body parameters against configured environment keys on endpoints that alter server state or behavior.
