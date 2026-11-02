# Sentinel Security Journal

## 2026-09-17 - Sensitive Fallback Database Exposure via Static Uploads Directory
**Vulnerability:** When running without Firebase Admin credentials, the backend persists its entire fallback database (posts, unmasked contact numbers, PIN hashes, claims, and chat messages) to `uploads/fallback_db.json`. Because `/uploads` was directly served statically by Express (`express.static`), any unauthenticated attacker could download `fallback_db.json` directly via `GET /uploads/fallback_db.json`.
**Learning:** Storing server-side state or fallback data within public static asset directories creates an immediate information disclosure vulnerability when that directory is mounted to a static file handler.
**Prevention:** Guard static asset mount points with path verification (`isSafeUploadPath`) that explicitly denies access to `.json` files, directory traversal (`..`), and paths containing `fallback_db`. Keep persistent data directories distinct from public file upload directories.
