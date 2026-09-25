# Sentinel's Journal

## 2026-06-29 - Administrative Endpoint Key Validation
**Vulnerability:** Unauthenticated `POST /api/config` endpoint allowed callers to modify global system configuration (`matchThreshold`).
**Learning:** System administration routes required authentication checks against environment secrets using constant-time comparison to prevent timing attacks.
**Prevention:** Always validate administrative keys via `validateAdminApiKey` using timing-safe comparisons (`crypto.timingSafeEqual`) on config modification routes.
