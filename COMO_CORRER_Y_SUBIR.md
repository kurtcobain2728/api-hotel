# 🏨 HotelAPI — Guía Completa: Cómo Correrlo y Subirlo a GitHub

---

## 📊 Estado del Proyecto (analizado el 12/03/2026)

El proyecto está **completo y funcional**. Aquí lo que tiene:

| Componente | Estado | Detalle |
|---|:---:|---|
| `src/` — Código fuente | ✅ | controllers, services, models, routes, middleware, utils, config, validators |
| `tests/` — Tests | ✅ | unit/, integration/, properties/, helpers/ |
| `dist/` — Build compilado | ✅ | TypeScript ya compilado a JavaScript |
| `coverage/` — Cobertura | ✅ | Reporte de cobertura generado |
| `Dockerfile` | ✅ | Multi-stage (builder + production) |
| `docker-compose.yml` | ✅ | App + MongoDB con healthcheck y volumen |
| `.env.example` | ✅ | Template de variables de entorno |
| `.gitignore` | ✅ | node_modules, dist, .env, coverage excluidos |
| `package.json` | ✅ | Todos los scripts configurados |
| `README.md` | ✅ | Documentación completa |
| Git | ⚠️ | Inicializado pero **sin commits ni remote aún** |

---

## ▶️ PARTE 1 — Cómo Correr el Proyecto

### Opción A: Con Docker (recomendado — 3 comandos)

```bash
# 1. Entrar a la carpeta del proyecto
cd "c:\Users\Argenis282001\Documents\Proyectos de marzo\Semana 1 de marzo\hotel-api"

# 2. Crear el archivo .env (solo la primera vez)
copy .env.example .env

# 3. Levantar todo (API + MongoDB)
docker-compose up -d
```

**La API estará disponible en:**
- API: `http://localhost:3000/api/v1/health`
- Swagger UI: `http://localhost:3000/api-docs`

**Comandos útiles con Docker:**
```bash
docker-compose logs -f app        # Ver logs en tiempo real
docker-compose ps                 # Ver si los contenedores están corriendo
docker-compose down               # Detener (sin borrar datos)
docker-compose down -v            # Detener y borrar todo (datos incluidos)
```

---

### Opción B: Sin Docker (modo desarrollo con hot-reload)

**Prerequisito:** MongoDB corriendo localmente en el puerto 27017.

```bash
# 1. Entrar a la carpeta
cd "c:\Users\Argenis282001\Documents\Proyectos de marzo\Semana 1 de marzo\hotel-api"

# 2. Crear el .env (solo la primera vez)
copy .env.example .env

# 3. Instalar dependencias (si no están instaladas)
npm install

# 4. Iniciar en modo desarrollo (hot-reload automático)
npm run dev
```

**La API estará en:** `http://localhost:3000`

---

### Scripts disponibles

```bash
npm run dev              # Desarrollo con hot-reload (tsx watch)
npm run build            # Compilar TypeScript → dist/
npm start                # Producción (requiere build previo)
npm test                 # Ejecutar todos los tests
npm run test:coverage    # Tests + reporte de cobertura
npm run lint             # Verificar código con ESLint
npm run lint:fix         # Corregir errores automáticamente
npm run format           # Formatear con Prettier
npm run typecheck        # Verificar tipos sin compilar
```

---

## 🐙 PARTE 2 — Subir a GitHub

El proyecto ya tiene `.git` inicializado. Solo necesitas crear el repo en GitHub y conectarlo.

### Paso 1 — Crear el repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Configura así:

| Campo | Valor |
|---|---|
| **Repository name** | `hotel-api` |
| **Description** | `API REST profesional para gestión hotelera: habitaciones, huéspedes y reservas` |
| **Visibility** | Public ✅ (para portafolio) |
| **Initialize repository** | ❌ NO marcar (ya tenemos el código local) |
| **Add .gitignore** | ❌ NO (ya tenemos uno) |
| **Add a license** | ❌ NO (opcional, puedes añadirla después) |

3. Click en **"Create repository"**
4. GitHub te mostrará una URL como: `https://github.com/TU_USUARIO/hotel-api.git`

---

### Paso 2 — Conectar y subir (ejecuta en PowerShell)

Copia y ejecuta estos comandos **uno por uno** en la terminal:

```bash
# Entrar a la carpeta del proyecto
cd "c:\Users\Argenis282001\Documents\Proyectos de marzo\Semana 1 de marzo\hotel-api"

# Agregar todos los archivos al staging
git add .

# Crear el primer commit
git commit -m "feat: initial commit - HotelAPI complete implementation

- REST API with Express + TypeScript + MongoDB
- CRUD endpoints: rooms, guests, bookings
- Zod validation on all endpoints
- Centralized error handling
- Swagger UI documentation at /api-docs
- Unit, integration and property-based tests
- Docker + Docker Compose setup
- Helmet + CORS + Rate Limiting security
- Structured logging with Winston"

# Renombrar la rama a main (estándar de GitHub)
git branch -M main

# Conectar con tu repositorio de GitHub
# ⚠️  REEMPLAZA TU_USUARIO con tu usuario real de GitHub
git remote add origin https://github.com/TU_USUARIO/hotel-api.git

# Subir el código
git push -u origin main
```

---

### Paso 3 — Verificar que todo subió bien

Abre en el navegador:
```
https://github.com/TU_USUARIO/hotel-api
```

Deberías ver el proyecto con el README.md mostrado automáticamente.

---

## 📌 Commits Futuros (flujo normal)

Cada vez que hagas cambios y quieras subirlos:

```bash
git add .
git commit -m "tipo: descripción breve del cambio"
git push
```

**Tipos de commit recomendados (Conventional Commits):**

| Tipo | Cuándo usarlo |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `docs:` | Solo documentación |
| `test:` | Agregar o corregir tests |
| `refactor:` | Refactoring sin cambios funcionales |
| `chore:` | Configuración, dependencias, etc. |

---

## ✅ Checklist para tu Roadmap en GitHub

Una vez subido, puedes marcar estas skills completadas en tu roadmap:

- [x] **Node.js** — servidor HTTP con Express
- [x] **TypeScript strict** — sin `any`, inferencia de tipos completa
- [x] **Express.js** — routing, middleware chain, async handlers
- [x] **MongoDB + Mongoose** — modelos, índices, hooks, populate, virtuals
- [x] **Zod** — validación de schemas en runtime
- [x] **REST API design** — CRUD, conventions, paginación, filtros
- [x] **Swagger/OpenAPI** — documentación auto-generada interactiva
- [x] **Error handling** — jerarquía de clases, middleware centralizado
- [x] **Testing** — Vitest, Supertest, fast-check (unit + integration + property)
- [x] **Docker** — Dockerfile multi-stage, docker-compose, healthchecks
- [x] **Seguridad HTTP** — Helmet, CORS, Rate Limiting
- [x] **Logging estructurado** — Winston, niveles, request ID
- [x] **ESLint + Prettier + Husky** — calidad de código automatizada
- [x] **Git** — commits convencionales, .gitignore profesional

---

## 💡 Tips para el README de GitHub

Tu `README.md` ya está excelente. Para que se vea aún mejor en GitHub:

1. **Agrega una sección de screenshots** — usa Swagger UI o Postman y toma capturas
2. **Agrega un GIF demo** — 5-10 segundos haciendo requests desde Swagger
3. **Actualiza el botón de autor** en el badge con tu usuario de GitHub

---

## 🔗 URLs del Proyecto Una Vez Corriendo

| Servicio | URL |
|---|---|
| API base | `http://localhost:3000/api/v1` |
| Health check | `http://localhost:3000/api/v1/health` |
| Swagger UI | `http://localhost:3000/api-docs` |
| Habitaciones | `http://localhost:3000/api/v1/rooms` |
| Huéspedes | `http://localhost:3000/api/v1/guests` |
| Reservas | `http://localhost:3000/api/v1/bookings` |
