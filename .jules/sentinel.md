# Sentinel Security Journal

## 2026-06-29 - Admin Config API Key Authentication & Timing-Safe Verification
**Vulnerability:** The administrative `POST /api/config` endpoint allowed unauthenticated modification of core application settings (`matchThreshold`).
**Learning:** Protecting admin endpoints with API keys requires constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks when validating secret tokens.
**Prevention:** Use `verifyAdminApiKey` utility function for timing-safe comparison of admin keys across server endpoints.
