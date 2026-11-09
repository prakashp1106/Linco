# Sentinel Security Journal

## 2026-06-29 - Sensitive Fallback Database Information Disclosure via `/uploads` Static Route
**Vulnerability:** The local database fallback file `fallback_db.json` was stored inside the `uploads/` folder and served directly to the public through `express.static(UPLOADS_DIR)` on `/uploads`, allowing unauthenticated clients to read posts, unmasked phone numbers, claims, and audit logs.
**Learning:** Storing backend fallback database files within the same public static directory as user-uploaded images without static route inspection exposes sensitive data.
**Prevention:** Guard the static file route with `isSafeUploadPath` to strictly deny access to `.json` files, dotfiles, or paths referencing `fallback_db`, and keep internal data storage separated from public file serving.
