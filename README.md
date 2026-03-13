# 🏨 HotelAPI

> API REST profesional para gestión hotelera: habitaciones, huéspedes y reservas.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x_strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Zod](https://img.shields.io/badge/Zod-3.x-3E67B1)](https://zod.dev)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![Swagger](https://img.shields.io/badge/Swagger_UI-/api--docs-85EA2D?logo=swagger&logoColor=black)](http://localhost:3000/api-docs)
[![Coverage](https://img.shields.io/badge/Coverage-≥80%25-brightgreen)](./coverage)

---

## 📋 Tabla de Contenidos

1. [¿Qué es HotelAPI?](#-qué-es-hotelapi)
2. [Stack tecnológico](#-stack-tecnológico)
3. [Arquitectura](#-arquitectura)
4. [Estructura del proyecto](#-estructura-del-proyecto)
5. [Instalación y ejecución](#-instalación-y-ejecución)
   - [Con Docker (recomendado)](#opción-1-con-docker-recomendado)
   - [Sin Docker (local)](#opción-2-sin-docker-local)
6. [Variables de entorno](#️-variables-de-entorno)
7. [Endpoints de la API](#-endpoints-de-la-api)
8. [Formato de respuestas](#-formato-de-respuestas)
9. [Scripts npm](#-scripts-npm)
10. [Testing](#-testing)
11. [Documentación interactiva (Swagger)](#-documentación-interactiva-swagger)
12. [Seguridad](#-seguridad)

---

## 🏨 ¿Qué es HotelAPI?

HotelAPI es una API REST construida como proyecto de portafolio profesional backend. Gestiona el ciclo completo de un hotel:

| Módulo | Funcionalidades |
|---|---|
| 🛏️ **Rooms** | CRUD, filtros por tipo/precio/estado, cambio de estado en tiempo real |
| 👤 **Guests** | Registro de huéspedes con historial de reservas vinculado |
| 📅 **Bookings** | Reservas con validación de disponibilidad de fechas, cálculo automático de precio |

**Destacados técnicos:**
- TypeScript estricto sin `any` — errores capturados en compilación
- Validación de datos en **todos** los endpoints con schemas Zod
- Formato de respuesta consistente `{ success, data | error, timestamp }` en todos los endpoints
- Documentación interactiva auto-generada con Swagger UI en `/api-docs`
- Tests unitarios, de integración y de propiedades con Vitest + Supertest
- Containerización completa con Docker + Docker Compose (un solo comando para levantar todo)
- Seguridad HTTP con Helmet + CORS + Rate Limiting integrados

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Node.js | 20+ | Runtime base |
| TypeScript | 5.x | Lenguaje (modo `strict`) |
| Express | 5.x | Framework HTTP |
| MongoDB | 7.x | Base de datos NoSQL |
| Mongoose | 8.x | ODM — modelos + queries |
| Zod | 3.x | Validación de schemas en runtime |
| Vitest | latest | Tests unitarios y de propiedades |
| Supertest | latest | Tests de integración HTTP |
| fast-check | latest | Property-based testing |
| Swagger UI + swagger-jsdoc | latest | Documentación auto-generada |
| Winston | latest | Logging estructurado |
| Helmet | latest | Headers de seguridad HTTP |
| express-rate-limit | latest | Rate limiting por IP |
| Docker + Compose | 24+ | Containerización |
| ESLint + Prettier | latest | Calidad y formato de código |
| Husky + lint-staged | latest | Pre-commit hooks automáticos |

---

## 🏗️ Arquitectura

El sistema implementa **arquitectura en capas** con separación estricta de responsabilidades:

```
Cliente HTTP
     │
     ▼
┌─────────────────────────────────────────┐
│        Presentation Layer               │
│   Middleware (Helmet, CORS, Rate,       │
│   Logger, Validator) + Routes +         │
│   Controllers                           │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│       Business Logic Layer              │
│   Services (Room, Guest, Booking)       │
│   Reglas de negocio + disponibilidad    │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│   Mongoose Models + Schemas + Hooks     │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│           MongoDB 7.x                   │
└─────────────────────────────────────────┘
```

**Flujo de un request:**
1. `Helmet` → añade headers de seguridad
2. `CORS` → valida origen del request
3. `Rate Limiter` → rechaza si supera 100 req/15min por IP
4. `express.json()` → parsea el body
5. `requestLogger` → asigna X-Request-ID único y registra en logs
6. `validateRequest(schema)` → valida body/query con Zod (→ 400 si falla)
7. `Controller` → extrae datos y llama al Service
8. `Service` → aplica lógica de negocio (disponibilidad, unicidad, etc.)
9. `Model/DB` → operación en MongoDB
10. `errorHandler` → captura cualquier error y formatea la respuesta

---

## 📁 Estructura del Proyecto

```
hotel-api/
├── src/
│   ├── config/
│   │   ├── env.ts             # Carga y valida variables de entorno con Zod
│   │   ├── database.ts        # Conexión MongoDB con retry logic (backoff 1s×2^n, 5 intentos)
│   │   └── swagger.ts         # Configuración de Swagger UI
│   │
│   ├── models/
│   │   ├── room.model.ts      # Schema Mongoose: roomNumber(único), type, price, status
│   │   ├── guest.model.ts     # Schema Mongoose: email(único), firstName, lastName, phone
│   │   └── booking.model.ts   # Schema Mongoose: refs Room+Guest, fechas, totalPrice auto
│   │
│   ├── validators/
│   │   ├── room.validator.ts      # Schemas Zod: createRoom, updateRoom, roomFilters
│   │   ├── guest.validator.ts     # Schemas Zod: createGuest, updateGuest, guestFilters
│   │   ├── booking.validator.ts   # Schemas Zod: createBooking, updateBooking, bookingFilters
│   │   ├── common.validator.ts    # Schema Zod: paginación (page, limit≤100), sortBy
│   │   └── env.validator.ts       # Schema Zod: variables de entorno requeridas
│   │
│   ├── services/
│   │   ├── room.service.ts        # CRUD + filtros + cambio de estado
│   │   ├── guest.service.ts       # CRUD + búsqueda + historial
│   │   └── booking.service.ts     # CRUD + checkRoomAvailability + auto-update estado habitación
│   │
│   ├── controllers/
│   │   ├── room.controller.ts     # Handlers HTTP: extrae params y llama RoomService
│   │   ├── guest.controller.ts    # Handlers HTTP: extrae params y llama GuestService
│   │   ├── booking.controller.ts  # Handlers HTTP: extrae params y llama BookingService
│   │   └── health.controller.ts   # GET /api/v1/health: status DB + versión + uptime
│   │
│   ├── routes/
│   │   ├── index.ts               # Router principal bajo prefijo /api/v1
│   │   ├── room.routes.ts         # Rutas + validateRequest(schema) por ruta
│   │   ├── guest.routes.ts        # Rutas + validateRequest(schema) por ruta
│   │   └── booking.routes.ts      # Rutas + validateRequest(schema) por ruta
│   │
│   ├── middleware/
│   │   ├── validate.middleware.ts  # validateRequest(schema): extrae body/query, valida con Zod
│   │   ├── error.middleware.ts     # errorHandler: captura todos los errores, formatea ApiResponse
│   │   ├── logger.middleware.ts    # requestLogger: X-Request-ID, logs HTTP con timing
│   │   └── notFound.middleware.ts  # notFoundHandler: 404 para rutas no registradas
│   │
│   ├── utils/
│   │   ├── logger.ts          # Winston configurado: JSON en prod, pretty en dev
│   │   ├── pagination.ts      # buildPaginatedResult(), calcSkip()
│   │   ├── apiError.ts        # AppError, ValidationError, NotFoundError, ConflictError, DatabaseError
│   │   └── asyncHandler.ts    # Wrapper: captura errores async y los pasa a next()
│   │
│   ├── types/
│   │   └── express.d.ts       # Extensión de tipos Express (X-Request-ID)
│   │
│   ├── app.ts                 # Crea Express app: Helmet→cors→rateLimit→json→logger→router→404→errors
│   └── server.ts              # Conecta DB → inicia servidor → maneja SIGTERM/SIGINT
│
├── tests/
│   ├── unit/
│   │   ├── services/              # Tests servicios con mocks de Mongoose
│   │   ├── validators/            # Tests schemas Zod
│   │   └── utils/                 # Tests paginación
│   ├── integration/
│   │   ├── rooms.api.test.ts      # Tests E2E endpoints /rooms con mongodb-memory-server
│   │   ├── guests.api.test.ts     # Tests E2E endpoints /guests
│   │   └── bookings.api.test.ts   # Tests E2E endpoints /bookings
│   ├── properties/
│   │   ├── room.properties.test.ts       # Property tests con fast-check
│   │   ├── guest.properties.test.ts
│   │   ├── booking.properties.test.ts
│   │   ├── pagination.properties.test.ts
│   │   └── serialization.properties.test.ts
│   └── helpers/
│       ├── testDb.ts          # setupTestDb, teardownTestDb, clearTestDb (mongodb-memory-server)
│       ├── generators.ts      # roomArbitrary, guestArbitrary, bookingArbitrary (fast-check)
│       ├── fixtures.ts        # Datos fijos de prueba
│       └── setup.ts           # Setup global de Vitest
│
├── .env.example               # Plantilla con TODAS las variables documentadas
├── .env                       # Variables locales — NO commitear — en .gitignore
├── Dockerfile                 # Multi-stage: builder (npm ci + tsc) → production (distroless)
├── docker-compose.yml         # Servicios: app + mongodb con healthcheck y volumen persistente
├── .dockerignore              # Excluye node_modules, dist, .env, tests, coverage
├── tsconfig.json              # strict:true, target:ES2020, outDir:dist
├── vitest.config.ts           # coverage v8, threshold 80%, reporters text+json+html
├── .eslintrc.json             # @typescript-eslint + no-any + import order
├── .prettierrc                # singleQuote:true, semi:true, tabWidth:2
├── .gitignore                 # node_modules, dist, .env, coverage, *.log
└── package.json               # Scripts: dev, build, start, test, test:coverage, lint, format
```

---

## 🚀 Instalación y Ejecución

### Prerequisitos

- **Con Docker:** Solo necesitas [Docker Desktop](https://docker.com) instalado
- **Sin Docker:** [Node.js 20+](https://nodejs.org) + MongoDB 7 corriendo localmente

---

### Opción 1: Con Docker (recomendado)

La forma más rápida — levanta la API + MongoDB con un solo comando:

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd hotel-api

# 2. Configurar variables de entorno
cp .env.example .env
# (edita .env si quieres cambiar algún valor)

# 3. Levantar todos los servicios en background
docker-compose up -d

# ✅ La API estará disponible en:
#    http://localhost:3000/api/v1/health
#    http://localhost:3000/api-docs
```

**Comandos útiles con Docker:**

```bash
docker-compose logs -f app        # Ver logs en tiempo real
docker-compose ps                 # Ver estado de los servicios
docker-compose down               # Detener (mantiene datos)
docker-compose down -v            # Detener y borrar volúmenes (borra datos)
docker-compose build --no-cache   # Reconstruir imagen
```

---

### Opción 2: Sin Docker (local)

```bash
# 1. Clonar e instalar dependencias
git clone <url-del-repositorio>
cd hotel-api
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL local

# 3. Iniciar en modo desarrollo (hot-reload con tsx)
npm run dev

# ✅ API disponible en: http://localhost:3000
```

> **Nota:** Asegúrate de que MongoDB esté corriendo localmente.
> Instalación rápida: `brew install mongodb-community` (macOS) o sigue la [guía oficial](https://www.mongodb.com/docs/manual/installation/).

---

## ⚙️ Variables de Entorno

Copia `.env.example` como `.env` y ajusta los valores:

```env
# ── Servidor ────────────────────────────
PORT=3000
NODE_ENV=development   # development | production | test

# ── Base de Datos ────────────────────────
DATABASE_URL=mongodb://localhost:27017/hotel-api
# Con Docker: DATABASE_URL=mongodb://mongodb:27017/hotel-api

# ── CORS ─────────────────────────────────
CORS_ORIGIN=*          # Ejemplo producción: https://mi-frontend.com

# ── Logging ──────────────────────────────
LOG_LEVEL=info         # error | warn | info | debug
```

| Variable | Requerida | Default | Descripción |
|---|:---:|---|---|
| `PORT` | No | `3000` | Puerto del servidor HTTP |
| `NODE_ENV` | No | `development` | Entorno de ejecución |
| `DATABASE_URL` | **Sí** | — | URI de conexión MongoDB |
| `CORS_ORIGIN` | No | `*` | Origen(s) permitidos para CORS |
| `LOG_LEVEL` | No | `info` | Nivel mínimo de logging |

> ⚠️ Si `DATABASE_URL` falta o tiene formato inválido, la app falla al iniciar con un mensaje descriptivo.

---

## 📡 Endpoints de la API

**Base URL:** `http://localhost:3000/api/v1`

### 🛏️ Habitaciones — `/rooms`

| Método | Ruta | Descripción | Cuerpo | Respuesta |
|---|---|---|---|---|
| `POST` | `/rooms` | Crear habitación | `CreateRoomDTO` | `201` + habitación creada |
| `GET` | `/rooms` | Listar con filtros y paginación | — | `200` + lista paginada |
| `GET` | `/rooms/:id` | Obtener por ID | — | `200` + habitación |
| `PUT` | `/rooms/:id` | Actualizar datos | `UpdateRoomDTO` | `200` + habitación actualizada |
| `DELETE` | `/rooms/:id` | Eliminar | — | `204` sin body |
| `PATCH` | `/rooms/:id/status` | Cambiar solo el estado | `{ status }` | `200` + habitación actualizada |

**Query params disponibles para `GET /rooms`:**
```
?type=single|double|suite|deluxe
&status=disponible|ocupada|mantenimiento|limpieza
&minPrice=50         (precio ≥ valor)
&maxPrice=500        (precio ≤ valor)
&available=true      (solo status='disponible')
&search=vista        (búsqueda en número y descripción)
&sortBy=price        (price | roomNumber | createdAt)
&sortOrder=asc|desc
&page=1              (default: 1)
&limit=10            (default: 10, máx: 100)
```

**Ejemplo de cuerpo para `POST /rooms`:**
```json
{
  "roomNumber": "101",
  "type": "double",
  "price": 150,
  "capacity": 2,
  "description": "Habitación doble con vista al jardín",
  "amenities": ["WiFi", "TV", "Aire acondicionado"]
}
```

---

### 👤 Huéspedes — `/guests`

| Método | Ruta | Descripción | Cuerpo | Respuesta |
|---|---|---|---|---|
| `POST` | `/guests` | Registrar huésped | `CreateGuestDTO` | `201` + huésped creado |
| `GET` | `/guests` | Listar con búsqueda y paginación | — | `200` + lista paginada |
| `GET` | `/guests/:id` | Obtener + historial de reservas | — | `200` + huésped con bookings |
| `PUT` | `/guests/:id` | Actualizar datos | `UpdateGuestDTO` | `200` + huésped actualizado |
| `DELETE` | `/guests/:id` | Eliminar | — | `204` sin body |

**Query params para `GET /guests`:**
```
?search=Juan                (busca en firstName, lastName, email)
&sortBy=lastName|email|createdAt
&sortOrder=asc|desc
&page=1&limit=10
```

---

### 📅 Reservas — `/bookings`

| Método | Ruta | Descripción | Cuerpo | Respuesta |
|---|---|---|---|---|
| `POST` | `/bookings` | Crear reserva | `CreateBookingDTO` | `201` + reserva creada |
| `GET` | `/bookings` | Listar con filtros y paginación | — | `200` + lista paginada |
| `GET` | `/bookings/:id` | Obtener con guest y room populados | — | `200` + reserva completa |
| `PUT` | `/bookings/:id` | Actualizar estado | `UpdateBookingDTO` | `200` + reserva actualizada |
| `DELETE` | `/bookings/:id` | Cancelar (soft delete) | — | `200` + reserva cancelada |
| `PATCH` | `/bookings/:id/status` | Cambiar solo el estado | `{ status }` | `200` + reserva actualizada |

**Query params para `GET /bookings`:**
```
?guestId=<ObjectId>
&roomId=<ObjectId>
&status=pendiente|confirmada|check-in|check-out|cancelada
&checkInDate=2024-04-01     (ISO 8601)
&checkOutDate=2024-04-05    (ISO 8601)
&sortBy=checkInDate|checkOutDate|totalPrice|createdAt
&sortOrder=asc|desc
&page=1&limit=10
```

**Ejemplo de cuerpo para `POST /bookings`:**
```json
{
  "guestId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "roomId": "65f1a2b3c4d5e6f7a8b9c0d2",
  "checkInDate": "2024-04-01",
  "checkOutDate": "2024-04-05",
  "numberOfGuests": 2,
  "specialRequests": "Cama king si está disponible"
}
```

> **Nota:** `totalPrice` se calcula automáticamente: `precio_habitación_por_noche × número_de_noches`.

> **Lógica de estados:** Al cambiar una reserva a `check-in`, el estado de la habitación cambia automáticamente a `ocupada`. Al cambiar a `check-out`, la habitación pasa a `limpieza`.

---

### 🔧 Utilidades

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/health` | Health check — estado de MongoDB, versión, uptime |
| `GET` | `/api-docs` | Swagger UI — documentación interactiva de todos los endpoints |

**Respuesta de `/api/v1/health` cuando todo está OK:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "version": "1.0.0",
    "timestamp": "2024-03-12T18:00:00.000Z",
    "uptime": 3600
  },
  "timestamp": "2024-03-12T18:00:00.000Z"
}
```

---

## 📦 Formato de Respuestas

**Todos los endpoints** siguen el mismo contrato `ApiResponse<T>`:

**✅ Respuesta exitosa (201 / 200):**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-03-12T18:00:00.000Z"
}
```

**✅ Respuesta exitosa con paginación (200):**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-03-12T18:00:00.000Z"
}
```

**❌ Respuesta de error (400 / 404 / 409 / 429 / 500):**
```json
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "code": "VALIDATION_ERROR | NOT_FOUND | CONFLICT | RATE_LIMIT_EXCEEDED | INTERNAL_ERROR",
    "details": [
      { "path": "price", "message": "Must be > 0", "received": -100 }
    ]
  }
}
```

---

## 📜 Scripts npm

```bash
# ── Desarrollo ───────────────────────────
npm run dev              # Modo desarrollo con hot-reload (tsx watch)

# ── Producción ──────────────────────────
npm run build            # Compila TypeScript → dist/
npm start                # Ejecuta dist/server.js (requiere build previo)

# ── Testing ─────────────────────────────
npm test                 # Ejecuta todos los tests (unit + integration + properties)
npm run test:watch       # Tests en modo watch (para desarrollo)
npm run test:coverage    # Tests + reporte de cobertura HTML en /coverage
npm run test:unit        # Solo tests unitarios
npm run test:integration # Solo tests de integración
npm run test:properties  # Solo property tests (fast-check)

# ── Calidad ──────────────────────────────
npm run lint             # Verifica código con ESLint
npm run lint:fix         # Corrige errores de ESLint automáticamente
npm run format           # Formatea código con Prettier
npm run typecheck        # Verifica tipos TypeScript sin compilar
```

---

## 🧪 Testing

El proyecto usa una estrategia **triple de testing**:

| Tipo | Herramienta | Propósito |
|---|---|---|
| **Unit tests** | Vitest + mocks | Servicios y middleware aislados |
| **Integration tests** | Supertest + mongodb-memory-server | Endpoints HTTP completos sin Docker |
| **Property tests** | fast-check | 44 propiedades del sistema con 100 iteraciones c/u |

**Ejecutar tests:**
```bash
npm test                  # Todos los tests
npm run test:coverage     # Con reporte de cobertura
                          # → Objetivo: ≥ 80% en líneas, funciones, branches, statements
```

**Setup de base de datos en tests:**
```typescript
// Los tests de integración usan mongodb-memory-server
// No necesitan ninguna base de datos externa
beforeAll(async () => await setupTestDb());
afterAll(async () => await teardownTestDb());
afterEach(async () => await clearTestDb());
```

---

## 📖 Documentación Interactiva (Swagger)

Con la API corriendo, abre en el navegador:

```
http://localhost:3000/api-docs
```

Desde Swagger UI puedes:
- Ver **todos los endpoints** con parámetros, tipos y ejemplos
- **Probar endpoints** directamente desde el navegador (botón "Try it out")
- Ver los **schemas de validación** Zod de cada request body
- Ver todos los **posibles códigos de respuesta HTTP**

---

## 🔒 Seguridad

| Capa | Biblioteca | Protección |
|---|---|---|
| Headers HTTP | `helmet` | Content-Security-Policy, X-Frame-Options, HSTS, XSS protection |
| CORS | `cors` | Solo orígenes en `CORS_ORIGIN` pueden hacer requests |
| Rate Limiting | `express-rate-limit` | Máx. 100 requests / 15 min por IP → responde con 429 |
| Trazabilidad | uuid v4 | Cada request tiene un `X-Request-ID` único en headers |
| Usuario Docker | — | El contenedor corre con usuario no-root `appuser` (UID 1001) |

---

## Enumeraciones de Referencia Rápida

**RoomType:** `single` · `double` · `suite` · `deluxe`

**RoomStatus:** `disponible` · `ocupada` · `mantenimiento` · `limpieza`

**BookingStatus:** `pendiente` · `confirmada` · `check-in` · `check-out` · `cancelada`

---

## 🤝 Contribución

1. Fork y clona el repositorio
2. Instala dependencias: `npm install`
3. Crea un branch: `git checkout -b feature/mi-mejora`
4. Implementa con tests incluidos
5. Verifica que todo pase: `npm test && npm run lint && npm run typecheck`
6. Commit (los pre-commit hooks verifican lint y formato automáticamente)
7. Abre un Pull Request con descripción clara del cambio

---

*Proyecto de portafolio — Stack: Node.js 20 · TypeScript 5 · Express 5 · MongoDB 7 · Zod 3*
