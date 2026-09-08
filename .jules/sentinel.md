## 2026-06-30 - Admin Config Endpoint Authentication
**Vulnerability:** Unauthenticated `POST /api/config` allowed anyone to modify the system-wide AI matching threshold (`matchThreshold`).
**Learning:** Administrative endpoints must enforce `process.env.ADMIN_API_KEY` validation via request headers (`X-Admin-Key`) or request body properties (`adminKey`).
**Prevention:** Always use `validateAdminKey()` helper function from `src/utils/security.ts` to validate admin authorization on management endpoints.
