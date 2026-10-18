## 2026-06-30 - Server Security Utilities Separation
**Vulnerability:** Unauthenticated `POST /api/config` allowed arbitrary modification of system-wide `matchThreshold`.
**Learning:** Placing server-side timing-safe key validation (`crypto.timingSafeEqual`) in `src/utils/security.ts` broke Vite frontend bundling because `crypto` is a Node built-in module.
**Prevention:** Isolate server-only security helpers in `src/utils/serverSecurity.ts` so client code imported via Vite remains browser-compatible.
