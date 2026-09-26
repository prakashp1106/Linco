## 2026-03-30 - Administrative Endpoint Key Validation with Timing-Safe Comparison
**Vulnerability:** The `POST /api/config` administrative endpoint allowed unauthenticated modification of global system matching threshold settings (`matchThreshold`).
**Learning:** Administrative endpoints configured via `ADMIN_API_KEY` require timing-safe string comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks during header/body token comparison.
**Prevention:** Use `validateAdminApiKey` in `src/utils/security.ts` to perform timing-safe token comparison whenever validating administrative API keys in Express handlers.
