## 2026-03-30 - Administrative Endpoint Auth & Timing-Safe Key Comparison
**Vulnerability:** `POST /api/config` allowed unauthenticated callers to modify global system configuration (`matchThreshold`).
**Learning:** Administrative endpoints modifying AI thresholds or system parameters require timing-safe API key validation (`crypto.timingSafeEqual`) checking both HTTP headers (`X-Admin-Key`) and body parameters (`adminKey`).
**Prevention:** Always enforce timing-safe API key authentication on administrative configuration endpoints.
