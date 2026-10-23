## 2026-06-30 - Timing-Safe Admin Authentication for Configuration Endpoints
**Vulnerability:** The `/api/config` POST endpoint allowed unauthenticated modification of global AI matching threshold (`matchThreshold`), exposing the platform to threshold manipulation and match notification flooding.
**Learning:** Node's `crypto.timingSafeEqual` throws an error if input buffers differ in length. Pre-hashing both the expected and provided API keys to fixed-length SHA-256 digests guarantees equal 32-byte Buffer lengths while preventing timing side-channel attacks.
**Prevention:** Always authenticate administrative configuration routes with `ADMIN_API_KEY` validated via constant-time SHA-256 buffer comparison.
