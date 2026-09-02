## 2026-06-29 - Unscoped Global Data Endpoints in PIN-Based App Architecture
**Vulnerability:** Unauthenticated/unscoped API endpoints like `GET /api/notifications` returned all notification records globally across all posts/users in the system, leaking match and claim alerts.
**Learning:** In a lightweight PIN-authenticated application without user session tokens, endpoints fetching user-related state must explicitly require target resource IDs (`postId`) to scope query execution on both database and memory levels.
**Prevention:** Always require target resource scope parameters (e.g. `postId`) on state read endpoints, validate parameter presence (rejecting missing parameters with HTTP 400), and perform server-side scoped filtering.
