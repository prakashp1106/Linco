## 2026-06-29 - Hardcoded Map API Key Leak
**Vulnerability:** MapmyIndia API Key was hardcoded in server.ts proxy handlers and LeafletMap component.
**Learning:** External API credentials in proxy endpoints should be read dynamically from environment variables (e.g., process.env.MAPMYINDIA_API_KEY) with optional fallback logic to open-source alternatives (OpenStreetMap Nominatim) when unconfigured.
**Prevention:** Use environment variables for all API keys and audit frontend/backend files for embedded secrets.
