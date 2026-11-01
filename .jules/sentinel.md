# Sentinel Security Journal

## 2026-06-29 - Sensitive Local Fallback Database Exposed via Public Uploads Directory
**Vulnerability:** When Firebase Admin credentials are not supplied or live database connection fails, the Express server falls back to writing local persistent JSON data to `uploads/fallback_db.json`. However, `server.ts` statically exposed the `/uploads` directory to the public via `express.static(UPLOADS_DIR)`. Any unauthenticated user could query `GET /uploads/fallback_db.json` and download the entire application database containing user posts, claims, audit logs, unmasked phone numbers, and bcrypt PIN hashes.
**Learning:** Storing internal database fallbacks or state files inside directories that are simultaneously served as static asset folders creates an immediate Information Disclosure vulnerability.
**Prevention:** Always place local storage/database files outside of public asset trees, or guard public static asset endpoints with strict path and extension filter middleware (denying `.json` and `fallback_db` with `403 Forbidden`).
