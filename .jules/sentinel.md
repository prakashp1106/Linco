## 2025-05-18 - Environment Variable Fallback for Third-Party Map Services
**Vulnerability:** Hardcoded MapmyIndia API key string `"gotklovuwdujpswuvxrfqwrecuoqfnycpqpy"` in map proxy server endpoints and frontend component.
**Learning:** Hardcoded API keys in proxy endpoints expose credentials. The server proxy can dynamically check `process.env.MAPMYINDIA_API_KEY || process.env.MAPPLS_API_KEY`, attempting MapmyIndia API calls only when configured and seamlessly falling back to OpenStreetMap / Nominatim geocoding services when missing.
**Prevention:** Avoid hardcoding static API tokens in server route handlers or React components; leverage environment variables and implement zero-config fallback providers for public services.
