# NOVAID Backend — Phases 4 & 5 Handover

> Written for the developer taking over Phase 6-7-8.
> Phases 1-3 (entities, DTOs, repositories, base controllers) were done by a colleague.
> Phases 4-5 (JWT auth + service layer) are documented here.

---

## How to Run the Project

### Prerequisites
- Java 17+
- Maven 3.9+ (installed at `~/maven/apache-maven-3.9.6/`)
- MySQL via XAMPP — start it from the XAMPP Control Panel
- Create a database named `novaid` if it doesn't exist

### Start the backend
```bash
cd backend
~/maven/apache-maven-3.9.6/bin/mvn spring-boot:run
# or on Windows:
C:\Users\az\maven\apache-maven-3.9.6\bin\mvn spring-boot:run
```
Runs on **http://localhost:8081**

### Start the frontend
```bash
npm install
npm run dev
```
Runs on **http://localhost:5173** — all `/api` calls are proxied to port 8081.

### Swagger UI
`http://localhost:8081/swagger-ui/index.html`
Click **Authorize** → paste `Bearer <token>` to test protected endpoints.

---

## Test Accounts (seeded automatically on first startup)

| Role        | Email                  | Password   |
|-------------|------------------------|------------|
| ADMIN       | admin@novaid.tn        | admin123   |
| AGENT       | aymen@novaid.tn        | agent123   |
| COORDINATOR | yosser@novaid.tn       | coord123   |

Passwords are BCrypt-hashed in the database. Seeded by `DataInitializer.java`.

---

## What Phase 4 Added — JWT Authentication

### New files
```
backend/src/main/java/com/novaid/
├── security/
│   ├── UserDetailsImpl.java          # Wraps User entity as Spring UserDetails
│   ├── UserDetailsServiceImpl.java   # Loads user by email for Spring Security
│   ├── JwtUtils.java                 # Generates and validates JWT tokens
│   └── AuthTokenFilter.java          # Extracts JWT from Authorization header on every request
├── controllers/
│   └── AuthController.java           # POST /api/auth/login  &  POST /api/auth/register
├── dto/
│   ├── LoginRequest.java             # { email, password }
│   ├── RegisterRequest.java          # { fullName, email, password, role, phone }
│   └── JwtResponse.java              # { token, type, id, fullName, email, role }
└── config/
    ├── SecurityConfig.java           # Stateless JWT security chain (REWRITTEN)
    ├── SwaggerConfig.java            # OpenAPI + Bearer JWT scheme for Swagger UI
    └── DataInitializer.java          # Seeds BCrypt users + sample visits at startup
```

### How authentication works
1. Client calls `POST /api/auth/login` with `{ email, password }`
2. Spring Security authenticates via `DaoAuthenticationProvider`
3. Server returns a JWT token (valid 24h)
4. Client stores token in `localStorage` and sends it as `Authorization: Bearer <token>` on every request
5. `AuthTokenFilter` intercepts each request, validates the token, and sets the security context

### Public routes (no token required)
```
POST /api/auth/login
POST /api/auth/register
GET  /swagger-ui/**
GET  /v3/api-docs/**
```
Everything else requires a valid JWT.

### application.properties keys added
```properties
novaid.app.jwtSecret=dGhpcyBpcyBhIHNlY3JldCBrZXkgZm9yIG5vdmFpZCBqd3QgdG9rZW4gZ2VuZXJhdGlvbg==
novaid.app.jwtExpirationMs=86400000

# NGO headquarters coordinates (used for GPS distance checks)
novaid.app.centerLat=36.8065
novaid.app.centerLng=10.1815
```

---

## What Phase 5 Added — Service Layer

### New files
```
backend/src/main/java/com/novaid/
├── services/
│   ├── UserService.java        # CRUD + soft delete (sets enabled=false)
│   ├── InventoryService.java   # CRUD + atomic addStock / removeStock
│   ├── FamilyService.java      # CRUD + distance to NGO center
│   └── VisitService.java       # CRUD + GPS check-in validation (500m radius)
└── utils/
    └── GeoUtils.java           # Haversine formula: distanceMeters(), isWithin500m()
```

### New DTOs
```
CheckInRequest.java      # { latitude: Double, longitude: Double }
StockAdjustRequest.java  # { quantity: int (min 1) }
```

---

## Full API Reference

### Auth — `/api/auth`
| Method | Endpoint             | Body                        | Returns       | Auth |
|--------|---------------------|-----------------------------|---------------|------|
| POST   | `/api/auth/login`   | `{ email, password }`       | JwtResponse   | No   |
| POST   | `/api/auth/register`| `{ fullName, email, password, role?, phone? }` | User | No |

### Users — `/api/users`
| Method | Endpoint         | Notes                              | Auth |
|--------|------------------|------------------------------------|------|
| GET    | `/api/users`     | List all users                     | Yes  |
| GET    | `/api/users/{id}`| Get one user                       | Yes  |
| POST   | `/api/users`     | Create user (password BCrypted)    | Yes  |
| PUT    | `/api/users/{id}`| Update user                        | Yes  |
| DELETE | `/api/users/{id}`| Soft delete (sets `enabled=false`) | Yes  |

### Families — `/api/families`
| Method | Endpoint                    | Notes                              | Auth |
|--------|-----------------------------|------------------------------------|------|
| GET    | `/api/families`             | List all active families           | Yes  |
| GET    | `/api/families/{id}`        | Get one family                     | Yes  |
| POST   | `/api/families`             | Create family                      | Yes  |
| PUT    | `/api/families/{id}`        | Update family                      | Yes  |
| DELETE | `/api/families/{id}`        | Delete family                      | Yes  |
| GET    | `/api/families/{id}/distance` | Distance in meters from NGO center | Yes |

### Inventory — `/api/items`
| Method | Endpoint                      | Body                    | Notes                          | Auth |
|--------|-------------------------------|-------------------------|--------------------------------|------|
| GET    | `/api/items`                  | —                       | List all items                 | Yes  |
| GET    | `/api/items/{id}`             | —                       | Get one item                   | Yes  |
| POST   | `/api/items`                  | ItemRequest             | Create item                    | Yes  |
| PUT    | `/api/items/{id}`             | ItemRequest             | Update item                    | Yes  |
| DELETE | `/api/items/{id}`             | —                       | Delete item                    | Yes  |
| PUT    | `/api/items/{id}/add-stock`   | `{ quantity: int }`     | Add stock atomically           | Yes  |
| PUT    | `/api/items/{id}/remove-stock`| `{ quantity: int }`     | Remove stock — 409 if insufficient | Yes |

### Visits — `/api/visits`
| Method | Endpoint                        | Body            | Notes                                      | Auth |
|--------|---------------------------------|-----------------|--------------------------------------------|------|
| GET    | `/api/visits`                   | —               | List all visits                            | Yes  |
| GET    | `/api/visits/{id}`              | —               | Get one visit                              | Yes  |
| GET    | `/api/visits/family/{familyId}` | —               | Visits for a specific family               | Yes  |
| GET    | `/api/visits/volunteer/{id}`    | —               | Visits for a specific volunteer            | Yes  |
| POST   | `/api/visits`                   | VisitRequest    | Create visit (status defaults to PLANNED)  | Yes  |
| PUT    | `/api/visits/{id}`              | VisitRequest    | Update visit                               | Yes  |
| DELETE | `/api/visits/{id}`              | —               | Delete visit                               | Yes  |
| POST   | `/api/visits/{id}/checkin`      | `{ latitude, longitude }` | GPS check-in — marks COMPLETED if within 500m, 409 if too far | Yes |

### Dashboard — `/api/dashboard`
| Method | Endpoint               | Notes                                          | Auth |
|--------|------------------------|------------------------------------------------|------|
| GET    | `/api/dashboard/summary` | Total families, urgent count, weekly visits chart, needs breakdown | Yes |

---

## Key Business Rules to Know

### GPS Check-in (500m rule)
- `POST /api/visits/{id}/checkin` receives the agent's GPS coordinates
- Backend calculates the Haversine distance between agent and family
- If distance > 500m → HTTP 409 Conflict with the actual distance in the error message
- If within 500m → sets `checkInLat`, `checkInLng`, `checkInTime`, status → `COMPLETED`
- Implemented in `VisitService.checkInLocation()` + `GeoUtils.distanceMeters()`

### Stock operations are atomic
- `addStock` and `removeStock` use `@Transactional` to prevent race conditions
- `removeStock` throws HTTP 409 if `quantity - requested < 0`

### Soft delete for users
- `DELETE /api/users/{id}` sets `enabled = false` — the user still exists in DB
- Spring Security's `UserDetailsImpl` reads `enabled` — disabled users cannot log in

### User roles
```java
enum UserRole { ADMIN, COORDINATOR, AGENT }
```
Role-based access control is not yet enforced at the endpoint level (all authenticated users can call all endpoints). If needed in Phase 6+, add `@PreAuthorize("hasRole('ADMIN')")` annotations.

### Visit statuses
```java
enum VisitStatus { PLANNED, COMPLETED }
```

### Family GPS storage
GPS coordinates are stored in a `GpsCoordinates` embedded object (`latitude`, `longitude`). Access via `family.getGps().getLatitude()`. A family with no GPS set will have `getGps() == null` — always null-check before using.

---

## Frontend Integration Notes

The React frontend (`src/`) communicates with the backend through:

- **`src/utils/api.js`** — `apiFetch()` helper that automatically injects the JWT token from `localStorage` into every request and redirects to `/login` on 401/403
- **Vite proxy** (`vite.config.js`) — all `/api` calls are proxied to `http://localhost:8081`, so no CORS issues and no hardcoded URLs in the frontend

Pages already connected to the real backend:
- `Login.jsx` — calls `/api/auth/login`, stores token + user in localStorage
- `App.jsx` — `PrivateRoute` component checks for token, redirects to `/login` if missing
- `Inventory.jsx` — full CRUD + add/remove stock
- `MyMissions.jsx` — loads visits from `/api/visits`
- `VisitCheckin.jsx` — loads visit from `/api/visits/{id}`, submits check-in to `/api/visits/{id}/checkin`

Pages **not yet connected** (still use hardcoded/mock data — left for Phase 6+):
- `Dashboard.jsx`
- `Families.jsx` / `FamilyDetails.jsx`
- `Users.jsx`
- `Carte.jsx`
- `Alertes.jsx`

---

## Database

MySQL database name: `novaid`
`data.sql` runs on every startup and resets: families, family_needs, items.
Users and visits are seeded by `DataInitializer.java` (runs once, only if users table is empty).

> **Note:** `spring.jpa.hibernate.ddl-auto=update` — Hibernate auto-creates/updates tables. Do not switch to `create-drop` or you will lose data on restart.
