# Sentinel Security Journal

## 2026-06-29 - Hardcoded MapmyIndia API Key
**Vulnerability:** A static MapmyIndia API key (`gotklovuwdujpswuvxrfqwrecuoqfnycpqpy`) was hardcoded in server proxy routes and frontend map component.
**Learning:** Hardcoded credentials in source files expose third-party API services to quota abuse and secret leaks.
**Prevention:** Use environment variables (`MAPMYINDIA_API_KEY`) on the server proxy and provide graceful fallbacks (e.g. OpenStreetMap/Nominatim) when unconfigured.
