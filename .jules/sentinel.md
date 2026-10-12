# Sentinel Journal - Security Learnings

## 2026-03-31 - Constant-Time API Key Validation for Administrative Endpoints
**Vulnerability:** Unprotected administrative configuration endpoint (`POST /api/config`) allowed unauthenticated clients to modify match threshold parameters across the application. Additionally, standard string equality comparison for API keys is susceptible to timing side-channel attacks.
**Learning:** Administrative endpoints managing platform-wide settings must require `ADMIN_API_KEY` authentication, and key validation must use constant-time bitwise comparisons to prevent timing attacks.
**Prevention:** Always validate administrative request headers/payloads against `ADMIN_API_KEY` using bitwise constant-time comparison in `validateAdminApiKey` before permitting configuration state updates.
