# LDH — Logistics & Delivery Hub

**Una plataforma integral de logística y paquetería** para empresas que necesitan gestionar envíos, oficinas, repartidores y políticas de precios de forma centralizada y escalable.

![Estado](https://img.shields.io/badge/status-active-brightgreen)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring%20Boot](https://img.shields.io/badge/Spring%20Boot-4.0.5-green)
![Astro](https://img.shields.io/badge/Astro-6.1.8-purple)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-ready-blue)

---

## 📋 Tabla de Contenidos

- [¿Qué es LDH?](#qué-es-ldh)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [UI/UX](#ui/ux)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Seguridad](#seguridad)
- [Base de Datos](#base-de-datos)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

---

## 🚀 ¿Qué es LDH?

LDH es una **aplicación web full-stack** de logística y paquetería diseñada para:

- ✅ **Clientes**: cotizar envíos, crear pedidos, rastrear paquetes en tiempo real
- ✅ **Repartidores**: gestionar entregas, actualizar estados, escanear códigos de barras
- ✅ **Administradores**: paneles de control, gestión de precios, auditoría de operaciones

Centraliza información que típicamente está dispersa en hojas de cálculo y correos electrónicos, garantizando **precios coherentes**, **trazabilidad completa** y **roles diferenciados**.

### Problema que resuelve

- Elimina errores manuales al cotizar envíos
- Proporciona historial completo de estados
- Permite configurar precios por zona geográfica con auditoría
- Escalable de desarrollo local (H2) a producción (PostgreSQL/Supabase)

---

## ✨ Características

### 🔓 Área Pública

- 🗺️ **Localizador de oficinas** con mapa interactivo (Leaflet)
- 📦 **Cotización en tiempo real** según origen, destino, peso y tipo de entrega
- 🔍 **Rastreo público** de envíos sin necesidad de login
- 💬 **Asistente IA** (powered by Groq) con respuestas en streaming
- 📱 **Responsive** y optimizado para móvil

### 👤 Portal de Cliente

- 📝 **Wizard de envío guiado** en 4 pasos
- 📋 **Mi área de cliente** con historial de envíos
- 📥 **Descarga de facturas y etiquetas** en PDF
- 🎯 **Seguimiento detallado** de pedidos
- 👥 **Gestión de cuenta** y datos personales

### 🚗 Área de Repartidor

- 📱 **Lista de envíos asignados** con filtros
- 📷 **Escaneo de códigos de barras** con cámara del navegador (ZXing)
- ⏱️ **Control de turno** (inicio/fin)
- 📍 **Actualización de estado con ubicación**
- 🔔 **Historial de entregas** del turno actual

### 🎛️ Panel Administrativo

- 📊 **Dashboard con KPIs** y gráficos en tiempo real
- 📦 **Gestión de envíos** con auditoría de cambios de estado
- 🏢 **Administración de oficinas** y sedes
- 👨‍💼 **Gestión de repartidores** y cuentas
- 💰 **Motor de precios completo**:
  - Zonas geográficas por código postal
  - Matriz de precios origen × destino
  - Modificadores por tipo de entrega
  - Tramos de peso con tarifas escalonadas
  - Export/import de datos en CSV

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                   Navegador del Cliente                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + JWT
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           Frontend: Astro + React + TypeScript               │
│  (Sitio público, wizards, dashboards, mapas, PDF)           │
└──────────────────────────┬──────────────────────────────────┘
                           │ fetch(JSON)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          Backend: Spring Boot 4.0.5 (Java 21)               │
│                      API REST JSON                           │
│  ├─ Seguridad: JWT + roles (CLIENTE, REPARTIDOR, ADMIN)    │
│  ├─ Servicios: cotización, envíos, precios, auditoría      │
│  ├─ Repositorios: Spring Data JPA                           │
│  └─ Validación: Bean Validation + custom validators         │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQL
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                Base de Datos (H2 / PostgreSQL)              │
│  Usuarios, Envíos, Oficinas, Zonas, Matriz de Precios,     │
│  Auditoría, Modificadores de Entrega                        │
└─────────────────────────────────────────────────────────────┘
```

### Decisiones de Arquitectura

- **Spring Boot** → Ecosistema maduro, JPA/Hibernate, transacciones claras
- **Astro + React** → Islas de interactividad, excelente rendimiento y SEO
- **PostgreSQL** → Modelo relacional fuerte, índices, FK, integración con Liquibase
- **JWT** → API stateless, escalable horizontalmente, sin sesiones en servidor
- **Liquibase** → Migraciones versionadas y reproducibles

---

## 🛠️ Tecnologías

### Backend

| Tecnología | Propósito |
|-----------|-----------|
| **Java 21** | Lenguaje base |
| **Spring Boot 4.0.5** | Framework web |
| **Spring Security + JWT** | Autenticación/autorización |
| **Spring Data JPA** | ORM y persistencia |
| **Liquibase** | Migraciones versionadas |
| **H2** | BD desarrollo/testing |
| **PostgreSQL** | BD producción |
| **Jakarta Validation** | Validación de entrada |
| **JJWT 0.12.6** | Firma y validación JWT |
| **Lombok** | Reducir boilerplate |

### Frontend

| Tecnología | Propósito |
|-----------|-----------|
| **Astro 6.1.8** | Framework web SSR/static |
| **React 19** | Componentes interactivos |
| **TypeScript** | Tipado seguro |
| **Tailwind CSS v4** | Utilidad-first styling |
| **Leaflet** | Mapas OpenStreetMap |
| **ZXing** | Escaneo códigos de barras |
| **jsPDF** | Generación PDFs en cliente |
| **Recharts** | Gráficos en dashboards |
| **Lucide React** | Iconografía SVG |

### Integraciones Externas

- **Groq AI** → Asistente IA con streaming
- **Nominatim (OSM)** → Geocoding opcional de oficinas
- **Supabase** → PostgreSQL gestionado (alternativa)

---

## 📋 Requisitos Previos

### Desarrollo Local

- **Java 21** o superior
- **Node.js 22+** (recomendado nvm)
- **Maven 3.9+**
- **Git**
- *Opcional:* Docker para PostgreSQL si usas Supabase en local

### Variables de Entorno

Copiar plantilla y adaptar:

```bash
cp backend/env.supabase.example backend/.env
```

**Para desarrollo local (H2 por defecto):**
```env
JWT_SECRET=tu-clave-secreta-super-fuerte-minimo-32-caracteres
JWT_EXPIRATION_MS=86400000
```

**Para producción (PostgreSQL/Supabase):**
```env
SPRING_PROFILES_ACTIVE=supabase
DB_URL=jdbc:postgresql://host:5432/database
DB_USER=user
DB_PASSWORD=password
GROQ_API_KEY=tu-clave-groq-opcional
LDH_CORS_ALLOWED_ORIGINS=https://tudominio.com
```

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/ldh.git
cd ldh
```

### 2. Backend (Java + Spring Boot)

```bash
cd backend

# Compilar
mvn clean package -DskipTests

# Ejecutar (H2 por defecto)
mvn spring-boot:run
```

**El servidor estará disponible en:** `http://localhost:8080`

La **consola H2** (desarrollo): `http://localhost:8080/h2-console`

### 3. Frontend (Astro + React)

```bash
cd ../frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

**El sitio estará disponible en:** `http://localhost:3000`

### 4. Variables de Entorno (desarrollo)

Backend: crear `backend/.env`
```env
JWT_SECRET=dev-secret-32-chars-minimun-here-ok
JWT_EXPIRATION_MS=86400000
GROQ_API_KEY=gsk_... # opcional para chat IA
```

Frontend: actualizar `.env` (si aplica)
```env
PUBLIC_API_URL=http://localhost:8080
```

---

## 📁 Estructura del Proyecto

```
ldh/
├── backend/                          # API REST Spring Boot
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/ldh/
│   │   │   │   ├── config/          # Configuración seguridad, JWT, Bootstrap
│   │   │   │   ├── domain/          # Entidades JPA
│   │   │   │   ├── repository/      # Spring Data JPA
│   │   │   │   ├── service/         # Lógica de negocio
│   │   │   │   ├── security/        # JWT, autenticación
│   │   │   │   ├── validation/      # Validadores custom
│   │   │   │   ├── web/             # REST Controllers + DTOs
│   │   │   │   └── geocoding/       # Nominatim integration
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       ├── application-supabase.properties
│   │   │       └── db/changelog/    # Liquibase migrations
│   │   └── test/
│   ├── pom.xml                      # Dependencias Maven
│   └── .gitignore
│
├── frontend/                         # Sitio Astro + React
│   ├── src/
│   │   ├── pages/                   # Rutas Astro (.astro)
│   │   ├── layouts/                 # Layouts compartidos
│   │   ├── components/              # Componentes React (.tsx)
│   │   ├── lib/                     # Utilidades, helpers, API
│   │   └── styles/                  # CSS global
│   ├── package.json
│   ├── astro.config.mjs
│   ├── tsconfig.json
│   └── .gitignore
│
├── PROJECT_REPORT.md                # Informe técnico detallado
└── README.md                         # Este archivo
```

### Carpetas Principales

#### Backend

- **`config/`** → Seguridad JWT, CORS, Bootstrap de datos iniciales
- **`domain/`** → Modelos JPA (User, Envio, Oficina, ShippingZone, PriceMatrixCell…)
- **`service/`** → Lógica de negocio (cotización, envíos, auditoría, precios)
- **`repository/`** → Acceso a datos con Spring Data JPA
- **`web/`** → REST controllers y DTOs para cada dominio
- **`security/`** → JWT, autenticación, Custom UserDetails

#### Frontend

- **`pages/`** → Rutas públicas, autenticación, área cliente, admin, repartidor
- **`components/`** → Widgets React reutilizables (forms, dashboards, mapas, chat)
- **`lib/`** → API wrappers, helpers de validación, exportación PDF, hooks

---

##  🧑‍🎨 UI/UX

### Pages

1. Home Page
![Home](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-2026-05-04-12_28_17.png)

2. Oficinas
![Oficinas](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-localiza-oficinas-2026-05-04-12_28_48.png)

3. Sigue un envio
![Sigue](/Docs/UI%20-%20UX%20images/Captura%20de%20pantalla%202026-05-04%20130017.png)

### Login/Signup

1. Login
![Login](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-login-2026-05-04-12_36_44.png)

2. Signup
![Signup](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-registro-2026-05-04-12_50_35.png)

### Enviar un paquete

1. Paso 1
![paso1](/Docs/UI%20-%20UX%20images/Captura%20de%20pantalla%202026-05-04%20125902.png)

2. Paso 2
![paso2](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-envio-paso-1-2026-05-04-13_00_44.png)

3. Paso 3
![paso3](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-envio-paso-2-2026-05-04-13_00_51.png)

4. Paso 4
![paso4](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-envio-paso-3-2026-05-04-13_01_31.png)

5. Paso 5
![paso5](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-envio-paso-4-2026-05-04-13_01_49.png)

6. Paso 6
![paso6](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-envio-exito-2026-05-04-13_02_50.png)

7. Factura
![factura](/Docs/pdf/LDH-factura-LDH-DG38-JFGJ.pdf)

8. Shipment Label
![etiqueta](/Docs/pdf/LDH-etiqueta-LDH-DG38-JFGJ.pdf)

### Admin Panel

1. Dashboard
![Dashboard Admin](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-admin-2026-05-04-12_25_53.png)

2. Oficinas
![Oficinas Admin](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-admin-oficinas-2026-05-04-12_26_04.png)

3. Repartidor
![Oficinas Admin](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-admin-repartidores-2026-05-04-12_26_21.png)

4. Envios
![Envios Admin](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-admin-envios-2026-05-04-12_26_50.png)

5. Zonas Graph
![Oficinas Zonas](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-admin-prices-zones-2026-05-04-12_27_22.png)

6. Matriz de Precios
-- Oficina a Oficina
![Matriz de Precios Admin oficna](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-admin-prices-matrix-2026-05-04-12_27_41.png)

-- Domicilio a Domicilio
![Matriz de Precios Admin Domicilio](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-admin-prices-matrix-2026-05-04-12_27_50.png)

-- Modificadores de entrega
![Modificadores Admin](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-admin-prices-matrix-2026-05-04-12_28_02.png)

### Repartidor Panel

1. Envios Activo
![Envios Repartidor](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-repartidor-2026-05-04-12_34_54.png)

2. Entregados e incidencias
![eei Repartidor](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-repartidor-historial-2026-05-04-12_35_17.png)

### Usuario Panel

1. Inico
![Inicio Usuario](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-cuenta-2026-05-04-12_35_37.png)

2. Mis envios
![Envios Usuario](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-cuenta-mis-envios-2026-05-04-12_35_58.png)

3. Seguimiento
![Tracking Usuario](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-cuenta-seguimiento-2026-05-04-12_36_08.png)

4. Oficinas
![Oficinas Usuario](/Docs/UI%20-%20UX%20images/screencapture-localhost-4321-cuenta-oficinas-2026-05-04-12_36_22.png)

---

## 🎯 Uso

### Crear un Envío (Cliente)

1. Ir a `/envio/paso-1`
2. Seleccionar origen/destino (CP español o internacional)
3. Peso y dimensiones
4. Tipo de entrega (oficina/domicilio)
5. Revisar cotización y datos destinatario
6. Confirmar → pago simulado → ¡éxito!

### Rastrear un Envío (Público)

1. Ir a `/seguimiento`
2. Ingresar número de tracking (p.ej. `LDH-XXXX-YYYY`)
3. Ver timeline de estados en tiempo real

### Panel Admin (Gestión de Precios)

1. Login como admin
2. Ir a `Admin` → `Precios`
3. **Zonas**: crear/editar áreas geográficas
4. **Matriz**: configurar precios por par origen × destino
5. **Modificadores**: ajustar tarifa por tipo entrega
6. **Export CSV** para análisis externo

### Repartidor (Entregas)

1. Login como repartidor
2. `Repartidor` → `Mis Envíos`
3. Escanear código de barras con cámara
4. Actualizar estado (ENTREGADO, EXCEPCIÓN…)
5. Finalizar turno

---

## 🔌 API Endpoints

### Públicos (sin JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/public/oficinas` | Lista todas las sedes |
| `GET` | `/api/public/envios/track/{tracking}` | Rastreo público |
| `GET` | `/api/public/pricing/delivery-types` | Tipos entrega disponibles |
| `POST` | `/api/public/pricing/quote` | Cotización |
| `POST` | `/api/public/chat/stream` | Chat IA (SSE streaming) |

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Registro cliente |
| `POST` | `/api/auth/login` | Login (devuelve JWT) |
| `GET` | `/api/auth/me` | Datos usuario actual |

### Cliente (`Authorization: Bearer <JWT>`, rol: CLIENTE)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/client/envios` | Mis envíos |
| `POST` | `/api/client/envios` | Crear envío |
| `GET` | `/api/client/envios/{id}/checkout-snapshot` | Factura/recibo |

### Repartidor (`Authorization: Bearer <JWT>`, rol: REPARTIDOR)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/repartidor/envios` | Envíos asignados |
| `PATCH` | `/api/repartidor/envios/{id}/status` | Actualizar estado |
| `POST` | `/api/repartidor/shift/start` | Iniciar turno |
| `POST` | `/api/repartidor/shift/end` | Finalizar turno |

### Admin (`Authorization: Bearer <JWT>`, rol: ADMIN)

| Sección | Método | Endpoint | Descripción |
|---------|--------|----------|-------------|
| **Dashboard** | `GET` | `/api/admin/dashboard/stats` | KPIs |
| | `GET` | `/api/admin/dashboard/charts` | Series gráficos |
| **Envíos** | `GET` | `/api/admin/envios` | Todos los envíos |
| | `PATCH` | `/api/admin/envios/{id}/status` | Cambiar estado + auditoría |
| | `GET` | `/api/admin/envios/{id}/audit` | Historial cambios |
| **Oficinas** | `GET` | `/api/admin/oficinas` | Lista sedes |
| | `POST` / `PUT` / `DELETE` | `/api/admin/oficinas` | CRUD sedes |
| **Repartidores** | `GET` | `/api/admin/repartidores` | Lista repartidores |
| | `POST` / `PUT` / `DELETE` | `/api/admin/repartidores` | CRUD repartidores |
| **Precios** | `GET` | `/api/admin/prices/zones` | Zonas |
| | `POST` / `PUT` / `DELETE` | `/api/admin/prices/zones` | CRUD zonas |
| | `GET` | `/api/admin/prices/matrix` | Matriz células |
| | `PATCH` | `/api/admin/prices/matrix/cells/{id}` | Editar precio célula |
| | `POST` | `/api/admin/prices/matrix/bulk` | Crear múltiples células |
| | `GET` | `/api/admin/prices/matrix/export.csv` | Descargar CSV |
| | `GET` | `/api/admin/prices/delivery-modifiers` | Modificadores tipo entrega |

**Ver `PROJECT_REPORT.md` para detalles de cuerpos de request/response.**

---

## 🔐 Seguridad

### Autenticación JWT

- Token emitido tras login exitoso
- Cabecera: `Authorization: Bearer <token>`
- Validez: configurable (default 24 horas)
- Secreto: mínimo 32 caracteres

### Autorización por Rol

| Rol | Acceso |
|-----|--------|
| **CLIENTE** | Área cliente, crear/consultar propios envíos |
| **REPARTIDOR** | Panel repartidor, actualizar estados |
| **ADMIN** | Paneles administrativos completos |

### Validación de Entrada

- **Bean Validation** con anotaciones (`@NotBlank`, `@Email`, `@Size`…)
- **Validadores custom**: CP español, contraseña fuerte, email realista
- **GlobalExceptionHandler**: respuestas JSON coherentes en errores

### CORS

- Configurable por entorno (`LDH_CORS_ALLOWED_ORIGINS`)
- Localhost permitido por defecto en desarrollo
- Whitelist en producción obligatoria

### Integridad de Precios

- Motor de cotización reside en **servidor** (no confiable en cliente)
- Endpoint público `/api/public/pricing/quote` devuelve precio calculado desde BD
- *Nota:* Para máxima seguridad, considerar **recalcular y validar** precio al crear envío en v2

---

## 🗄️ Base de Datos

### Perfil Desarrollo (H2)

```bash
mvn spring-boot:run
# BD en memoria, se limpia cada arranque
# Datos iniciales via Liquibase + DataInitializer
```

**Acceder a consola H2:** `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:ldh`
- User: `sa`
- Password: (vacío)

### Perfil Producción (PostgreSQL/Supabase)

```bash
export SPRING_PROFILES_ACTIVE=supabase
mvn spring-boot:run
```

Configurar en `application-supabase.properties` o variables de entorno:

```properties
spring.datasource.url=jdbc:postgresql://host:5432/db
spring.datasource.username=user
spring.datasource.password=pwd
spring.jpa.hibernate.ddl-auto=validate
```

### Migraciones (Liquibase)

Todos los cambios de esquema versionados en:

```
backend/src/main/resources/db/changelog/
├── db.changelog-master.xml
├── changes/
│   ├── 001-initial-schema.xml          # Tablas base
│   ├── 004-pricing-schema.xml          # Zonas, matriz, precios
│   ├── 005-envio-checkout-snapshot.xml # Snapshot facturas
│   └── 006-envio-audit-exception.xml   # Auditoría estados
```

**Flujo típico:**

1. Cambio en entidad JPA
2. Crear archivo `changes/NNN-descripcion.xml` en Liquibase
3. Incluir en `db.changelog-master.xml`
4. Migración automática al arrancar

---

## 💡 Decisiones Técnicas Principales

### ¿Por qué Spring Boot y no Node.js/Django?

- **Tipado fuerte** esencial en dominios financieros (precios, cálculos)
- **Ecosistema JPA/Hibernate** → modelo relacional sólido
- **Transacciones** declarativas con `@Transactional`
- Estándar en equipos empresariales

### ¿Por qué Astro + React y no Next.js?

- **Astro**: rendimiento, SSR, SEO, contenido estático por defecto
- **Islas React**: interactividad solo donde es necesaria
- Carga inicial rápida sin overhead de SPA global

### ¿Por qué PostgreSQL y no MySQL/MongoDB?

- **Relacional fuerte** (FK, índices, integridad)
- **Matriz de precios** requiere joins complejos
- **Mejor soporte** para GIS, tipos avanzados, cloud moderno

---

## 🧪 Testing

### Actualmente

- Test de smoke (`BackendApplicationTests`) para contexto Spring

### Recomendado para v2

```bash
# Backend: tests unitarios/integración
mvn test

# Frontend: tests componentes
npm run test
```

---

## 📚 Documentación Adicional

- **`PROJECT_REPORT.md`** → Informe técnico detallado (arquitectura, bugs enfrentados, timeline, todas las clases)
- **Javadoc** (backend) → Generar con `mvn javadoc:javadoc`
- **Storybook** (frontend) → Considerado para v2

---

## 🐛 Problemas Conocidos y Soluciones

| Problema | Causa | Solución |
|----------|-------|----------|
| `UnknownHostException` Supabase | Host IPv6 vs IPv4 | Usar Session Pooler IPv4 + usuario `postgres.PROJECT` |
| CORS rechaza API desde otro dominio | Headers faltantes | Configurar `LDH_CORS_ALLOWED_ORIGINS` |
| Escaneo no encuentra envío | Guiones inconsistentes | Normalización alfanumérica en cliente |
| Pantalla éxito "cargando" indefinido | Hidratación SSR/async | Ajuste estado inicial + `finally` en fetch |

---

## 🚦 Roadmap (v2)

- ✅ **MVP actual** → Funcionalidad core completa
- 📋 **v2 planeada**:
  - Tests automatizados ampliados
  - Rate limiting endpoints públicos
  - Observabilidad: Actuator + métricas
  - Recalcular precio en servidor (mayor seguridad)
  - Integración SMS/email notificaciones
  - Aplicación móvil nativa (React Native)
  - Integraciones ecommerce (Shopify, WooCommerce)

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. **Fork** el repositorio
2. **Branch** para tu feature (`git checkout -b feature/tu-caracteristica`)
3. **Commit** cambios (`git commit -am 'Añadir característica'`)
4. **Push** al branch (`git push origin feature/tu-caracteristica`)
5. **Pull Request** con descripción clara

### Guía de Estilo

- **Backend**: Java + Spring conventions, Lombok, records para DTOs
- **Frontend**: TypeScript strict, Astro + React, Tailwind utilities
- **BD**: Liquibase para todas las migraciones
- **Commits**: mensajes descriptivos en inglés o español

---

## 📄 Licencia

Distribuido bajo licencia **MIT**. Ver `LICENSE` para detalles.

---

## 📧 Contacto y Soporte

- **Issues**: Reportar bugs en la sección de Issues
- **Discussions**: Preguntas y propuestas en Discussions
- **Email**: (añadir si aplica)

---

## 🙏 Agradecimientos

- **Spring Boot Team** → Framework robusto
- **Astro Community** → Herramienta de frontend moderna
- **Groq** → API IA rápida
- **OpenStreetMap / Nominatim** → Datos geográficos abiertos

---

**Hecho con ❤️ para empresas de logística que necesitan control.**
