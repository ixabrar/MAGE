# MAGE Security Hardening Checklist

Use this checklist to verify security-sensitive behavior before deployment.

- [x] `next-auth` v5 configured with `AUTH_SECRET` from environment variables
- [x] Session strategy set to `jwt`
- [x] Auth API route exposed under `app/api/auth/[...nextauth]/route.ts`
- [x] Middleware redirects unauthenticated users away from `/dashboard*`
- [x] Dashboard layout enforces server-side session check via `auth()`
- [x] Resource-level authorization pattern documented for backend implementation
- [x] Raw biometric/health data marked as never logged
- [x] Sensitive upload handling reserved for backend validation
- [x] Audit log page added at `/dashboard/audit`
- [x] Privacy center page added at `/dashboard/privacy`
- [x] `suppressHydrationWarning` applied to known Brave-extension-sensitive containers
- [x] No credentials or secrets committed to repository

## Frontend security notes

- Do not trust frontend route hiding for real authorization.
- Do not cache sensitive assessment data in `localStorage`.
- Do not log raw uploads, faces, blood reports, or auth tokens.
- Continue to validate file type/size on the backend before storage or inference.

## Deployment notes

- Set `AUTH_SECRET` in production environment.
- Enforce HTTPS.
- Add security headers via Next.js config as needed.
- Add rate limiting and brute-force protection at the API/gateway layer.
