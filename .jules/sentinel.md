# Sentinel Security Journal - Critical Learnings

## 2026-06-30 - Unauthenticated Admin Configuration & Timing Attack Prevention
**Vulnerability:** The `POST /api/config` administrative endpoint allowed unauthenticated clients to arbitrarily modify the global AI matching threshold (`matchThreshold`).
**Learning:** Administrative endpoints controlling system-wide behavior must require authentication and use timing-safe comparison (`crypto.timingSafeEqual`) for key verification to prevent timing side-channel attacks.
**Prevention:** Always wrap administrative configuration endpoints with authentication middleware that validates `ADMIN_API_KEY` using constant-time string comparisons.
