# Security Architecture

Date: 2026-03-18

## Scope

This document describes the current security architecture across the three application surfaces in this workspace:

- `expense-tracker-app-nextjs` - Next.js web app
- `expense-tracker-app` - Expo mobile app
- `backend-api-expense-springboot` - Spring Boot API

## Decision

The system uses a split authentication model:

- Web app:
  - Firebase Web Auth is used for user sign-in.
  - The web app exchanges the Firebase ID token with the backend once.
  - The backend stores web auth in an `HttpOnly` cookie.
  - Browser mutations are protected with CSRF tokens.
- Mobile app:
  - Firebase ID tokens are sent as `Authorization: Bearer <token>`.
  - Mobile does not use cookie auth or CSRF.
- Backend API:
  - Accepts either bearer-token auth or cookie auth.
  - Uses Firebase Admin verification as the trust root.

## Why this model

- Web gets stronger protection against token exfiltration by moving normal API auth out of browser-readable storage.
- Mobile remains compatible with native clients and bearer-token API patterns.
- Backend centralizes identity verification and authorization decisions.
- CSRF is enforced only where it matters: browser cookie-auth requests.

## Trust Boundaries

- Firebase Auth is the identity provider.
- Spring Boot is the authorization and API boundary.
- Browser JavaScript is treated as untrusted for long-lived secrets.
- `HttpOnly` cookies are trusted for web transport but must be protected with CSRF.
- Mobile secure storage and in-memory Firebase token handling are separate from web cookie auth.

## Component Responsibilities

- Web app:
  - Sign in with Firebase Web SDK.
  - Exchange ID token for backend cookie via `/api/auth/session`.
  - Read `XSRF-TOKEN` cookie and send `X-XSRF-TOKEN` on mutating requests.
  - Use cookie auth for normal API traffic.
- Mobile app:
  - Fetch Firebase ID token from the mobile auth layer.
  - Send bearer token on API requests.
  - Obtain short-lived realtime relay tokens from backend.
- Backend API:
  - Verify Firebase ID tokens using Firebase Admin.
  - Write and clear auth cookies for web.
  - Enforce CSRF for cookie-auth unsafe requests.
  - Authenticate protected endpoints from bearer token or cookie.

## Current Security Controls

- Web Firebase auth persistence is `inMemoryPersistence`.
- Web API client uses `withCredentials=true`.
- Web mutating requests attach `X-XSRF-TOKEN`.
- Backend auth cookie is `HttpOnly`.
- Backend applies CSRF only to unsafe requests without bearer auth.
- Backend allows bearer-token authentication for mobile and special auth-exchange requests.
- Backend CORS is credential-aware.

## Mermaid: System Overview

```mermaid
flowchart LR
  subgraph WEB["Next.js Web App"]
    W1["Firebase Web Auth SDK<br/>signInWithEmail / signInWithPopup / signInWithCustomToken<br/>auth stored in memory"]
    W2["AuthContext"]
    W3["authApi.createSession()<br/>POST /api/auth/session<br/>Authorization: Bearer <Firebase ID Token>"]
    W4["Shared Axios Client<br/>withCredentials=true<br/>adds X-XSRF-TOKEN on POST/PUT/PATCH/DELETE"]
    W5["Browser Cookies<br/>access_token = HttpOnly<br/>XSRF-TOKEN = JS-readable"]
  end

  subgraph MOBILE["Expo Mobile App"]
    M1["firebaseAuthService"]
    M2["AI / API HTTP Client<br/>Authorization: Bearer <Firebase ID Token>"]
    M3["Sync Client<br/>Authorization: Bearer <Firebase ID Token>"]
    M4["Realtime Service<br/>requests relay session<br/>connects with socket token"]
  end

  subgraph API["Spring Boot Backend API"]
    B1["AuthController<br/>GET/POST /auth/session<br/>POST /auth/logout"]
    B2["SecurityConfig<br/>CORS + CSRF matcher"]
    B3["FirebaseAuthFilter<br/>accepts Bearer token or cookie"]
    B4["AuthCookieService<br/>writes/clears access_token cookie"]
    B5["FirebaseAuthenticationService<br/>verifyIdToken / createCustomToken"]
    B6["Protected Controllers + Services"]
  end

  subgraph EXT["External Services"]
    F1["Firebase Auth"]
    F2["Firebase Admin SDK"]
    D1["Supabase / Postgres"]
    R1["Realtime Relay"]
  end

  W1 -->|"user signs in"| F1
  F1 -->|"Firebase ID token"| W2
  W2 --> W3
  W3 -->|"Bearer ID token"| B1
  B1 --> B5
  B5 -->|"verify / mint custom token"| F2
  B1 --> B4
  B4 -->|"Set-Cookie: access_token"| W5

  W4 <-->|"cookie auth + X-XSRF-TOKEN"| B2
  B2 --> B3
  B3 --> B6
  B6 --> D1

  B1 -->|"GET /auth/session returns firebaseCustomToken"| W2
  W2 -->|"restore browser auth on reload"| W1

  M1 -->|"getIdToken()"| F1
  M1 --> M2
  M1 --> M3
  M2 -->|"Bearer token"| B3
  M3 -->|"Bearer token"| B3

  M4 -->|"getRealtimeSession()"| B6
  M4 -->|"socket token"| R1
```

## Mermaid: Web Login And Cookie Flow

```mermaid
sequenceDiagram
  actor U as User
  participant W as Next.js Web App
  participant FB as Firebase Auth
  participant API as Backend API
  participant SEC as Spring Security
  participant B as Browser

  U->>W: Login with email/password or Google
  W->>FB: signInWithEmail / signInWithPopup
  FB-->>W: Firebase ID token

  W->>API: POST /api/auth/session<br/>Authorization: Bearer ID token<br/>body: id_token
  API->>SEC: authenticate bearer token
  SEC->>FB: verifyIdToken via Admin SDK
  API-->>B: Set-Cookie access_token (HttpOnly)

  B->>API: GET /api/auth/session with cookie
  API->>SEC: authenticate cookie token
  SEC->>FB: verifyIdToken
  API-->>W: firebaseCustomToken + user metadata

  W->>FB: signInWithCustomToken
  FB-->>W: restored browser auth state in memory
```

## Mermaid: Web CSRF-Protected Request Flow

```mermaid
sequenceDiagram
  participant W as Next.js Axios Client
  participant B as Browser
  participant API as Backend API
  participant SEC as SecurityConfig + CsrfFilter
  participant CTRL as Protected Controller

  W->>API: GET /api/auth/session<br/>credentials: include
  API-->>B: Set-Cookie XSRF-TOKEN

  W->>B: read XSRF-TOKEN cookie
  W->>API: POST /api/...<br/>Cookie: access_token<br/>X-XSRF-TOKEN: cookie value
  API->>SEC: CSRF check
  SEC->>SEC: FirebaseAuthFilter authenticates cookie
  SEC-->>CTRL: authenticated user principal
  CTRL-->>W: JSON response
```

## Mermaid: Mobile Bearer-Token Flow

```mermaid
sequenceDiagram
  actor U as User
  participant M as Expo Mobile App
  participant FB as Firebase Auth
  participant API as Backend API
  participant RELAY as Realtime Relay

  U->>M: Login
  M->>FB: Firebase sign-in
  FB-->>M: Firebase ID token

  M->>API: GET/POST /api/...<br/>Authorization: Bearer ID token
  API-->>M: JSON response

  M->>API: GET realtime session
  API-->>M: socket_url + short-lived relay token
  M->>RELAY: websocket connect(auth.token)
  RELAY-->>M: realtime events
```

## Code References

- Web auth exchange:
  - `expense-tracker-app-nextjs/lib/api/auth.api.ts`
  - `expense-tracker-app-nextjs/contexts/AuthContext.tsx`
- Web API client and CSRF:
  - `expense-tracker-app-nextjs/lib/api/http.ts`
- Backend auth and CSRF:
  - `backend-api-expense-springboot/src/main/java/com/wing/backendapiexpensespringboot/controller/AuthController.java`
  - `backend-api-expense-springboot/src/main/java/com/wing/backendapiexpensespringboot/config/SecurityConfig.java`
  - `backend-api-expense-springboot/src/main/java/com/wing/backendapiexpensespringboot/security/AuthCookieService.java`
  - `backend-api-expense-springboot/src/main/java/com/wing/backendapiexpensespringboot/security/FirebaseAuthFilter.java`
  - `backend-api-expense-springboot/src/main/java/com/wing/backendapiexpensespringboot/security/FirebaseAuthenticationService.java`
- Mobile bearer-token clients:
  - `expense-tracker-app/services/api/http.ts`
  - `expense-tracker-app/services/api/sync.api.ts`
  - `expense-tracker-app/services/realtimeService.ts`

## Current Tradeoff

The current web implementation stores the submitted Firebase ID token in the backend auth cookie after verification. This is materially better than browser-readable token storage, but it is still not the cleanest long-term web session model.

Long-term hardening path:

- replace raw ID-token cookie usage with a Firebase session cookie or an opaque backend session identifier
- add stronger production-only security headers
- keep object-level authorization checks strict on every protected resource
