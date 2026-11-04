# Sentinel Security Journal

## 2026-11-04 - Static Route Data Leakage via Collocated Database Fallback Files
**Vulnerability:** The backend mounts `/uploads` to serve uploaded images via `express.static(UPLOADS_DIR)`. However, the local database persistence fallback file `fallback_db.json` was collocated inside `uploads/`. This exposed all user posts, unmasked phone numbers, potential matches, and system claims to unauthenticated public requests via `/uploads/fallback_db.json`.
**Learning:** Collocating server-side runtime persistence files inside directories exposed via static web servers or CDNs bypasses API authorization layers and leads to direct sensitive data disclosure.
**Prevention:** Guard static directory routes with strict path validation (`isSafeUploadPath`) preventing access to `.json` files, dotfiles/hidden files, and database keywords, or isolate runtime storage completely outside of web-accessible directories.
