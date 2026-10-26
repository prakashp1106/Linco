## 2026-06-30 - Administrative Endpoint API Key Validation

**Vulnerability:** Unauthenticated `POST /api/config` endpoint allowed unauthorized modification of global matching threshold parameters (`matchThreshold`).
**Learning:** Administrative endpoints controlling critical application logic require strict API key authentication using timing-safe comparisons (`crypto.timingSafeEqual`) to prevent parameter tampering and side-channel timing attacks.
**Prevention:** Always enforce `validateAdminApiKey` middleware or validation checks on administrative API endpoints and keep Node built-in imports server-side.
