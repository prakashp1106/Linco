# LINCO Security Policy

## Reporting Security Vulnerabilities
LINCO takes security and data privacy seriously. If you discover a vulnerability or security issue, please contact us immediately:

- **Security Team Email**: security@linco.ai / rinapathak470@gmail.com
- **Response Time**: Initial acknowledgment within 24 hours; remediation within 72 hours for critical severity.

## Architecture & Security Posture
- **Backend-as-Mediator**: Critical collections (`posts`, `claims`, `matches`, `audit_logs`, `notifications`) reject direct client read/write. All access is validated, authenticated, and logged server-side.
- **Client Security Rules**: `users` collections enforce ownership validation (`request.auth.uid == userId`) and strictly prevent unauthorized role elevation.
- **Rate Limiting**: Tiered endpoint rate limiters prevent API spam, AI extraction flooding, and PIN brute-force attacks.
- **Data Protection**: Sensitive contact numbers are masked for public viewing and unlocked only after verified claim resolution or explicit owner action.
- **Security Headers**: HSTS, X-Content-Type-Options, Referrer-Policy, and Content Security Policy (CSP) headers are actively enforced.
