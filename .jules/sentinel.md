## 2026-06-30 - Preventing Information Disclosure via Public Uploads Directory

**Vulnerability:** The application stored the offline local fallback database at `uploads/fallback_db.json`, while simultaneously mounting `uploads/` via `express.static` to serve uploaded images. This allowed unauthenticated remote attackers to directly download `http://<host>/uploads/fallback_db.json` containing sensitive posts, claims, audit logs, and users.

**Learning:** Co-locating local persistence JSON stores in the directory configured for static asset serving leads to catastrophic information disclosure if access control is not enforced at the route level.

**Prevention:** Gate static asset serving using an explicit validation filter (`isSafeUploadPath`) that verifies file extensions, denies `.json`, dotfiles, path traversal, and specifically blocks `fallback_db*`.
