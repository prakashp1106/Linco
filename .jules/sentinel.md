# Sentinel Security Journal

## 2026-06-29 - Fallback Database Information Disclosure via Static Asset Directory
**Vulnerability:** The local JSON persistence file (`uploads/fallback_db.json`) was located in the directory exposed by Express static serving (`express.static(UPLOADS_DIR)`). An unauthenticated client could access `/uploads/fallback_db.json` and download the entire fallback database containing post listings, claims, and notification history.
**Learning:** When building fallback persistence mechanisms that write to local disk, placing database files within the same directory tree served as static user-uploaded assets directly causes unauthorized data disclosure unless strict path-level filtering is applied.
**Prevention:** Guard static file routes with validation middleware (`isSafeUploadPath`) that denies non-image files, directory traversal attempts, and specifically blocks `.json` and `fallback_db` paths.
