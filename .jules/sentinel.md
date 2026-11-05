# Sentinel's Security Journal

## 2026-11-05 - Restricting /uploads Static Route to Prevent Local Database Disclosure
**Vulnerability:** The application maintains an offline persistence fallback file at `uploads/fallback_db.json`. Because Express statically served the entire `uploads` folder without path or extension filtering, unauthenticated clients could directly request `GET /uploads/fallback_db.json` and dump all sensitive application data (including unmasked contact details, hashed security PINs, claims, and notifications).
**Learning:** Co-locating writable fallback database files inside a public static asset directory creates an immediate information disclosure vulnerability when using static file middleware without path guards.
**Prevention:** Always gate static directory endpoints with an path verification helper (`isSafeUploadPath`) that strictly rejects `.json` files, dotfiles, paths matching `fallback_db`, or directory traversal (`..`), ensuring only valid upload assets can be fetched.
