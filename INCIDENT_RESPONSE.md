# LINCO Security Incident Response Playbook

## Severity Levels
- **P0 - Critical**: Active data breach, unauthenticated remote code execution, database compromise.
- **P1 - High**: Rate limiting bypass, unauthorized claim access, AI token exhaustion.
- **P2 - Medium**: Non-critical policy discrepancy, cosmetic CSP error.

## Standard Operating Procedure (SOP)
1. **Identification**: Alert triggered by error spikes in `/api/health`, audit log anomaly, or user submission.
2. **Containment**:
   - For compromised credentials: Immediately rotate `GEMINI_API_KEY`, `CLOUDINARY_*`, or Firebase Service Account in Cloud Secrets.
   - For malicious IP attack: Update Cloud Armor / reverse proxy blocklist.
3. **Eradication & Remediation**: Deploy patched container revision via GitHub Actions.
4. **Recovery & Verification**: Run automated Vitest test suite (`npm test`) and inspect `/api/health`.
5. **Post-Incident Review**: Document root cause within 5 business days and notify impacted users as required by applicable data protection laws.
