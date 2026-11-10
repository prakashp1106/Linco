## 2026-11-10 - Sensitive Local Fallback Database Exposure via Static Uploads Directory
**Vulnerability:** The Express server served the `/uploads` directory via `express.static`, but also stored the local JSON database file (`fallback_db.json`) directly inside `/uploads`. Any unauthenticated request to `/uploads/fallback_db.json` disclosed full post records, claims, verification answers, and contact info.
**Learning:** Shared directories for user-accessible uploads and persistent data fallbacks create an accidental directory exposure vector when static serving is configured on the root of that folder.
**Prevention:** Guard static routes with an explicit path validation helper (`isSafeUploadPath`) that rejects `.json` files, dotfiles, and known database paths, returning 403 Forbidden.
