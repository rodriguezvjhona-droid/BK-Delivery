# 🥨 BK DELIVERY — SISTEMA EMPRESARIAL DE GESTIÓN GASTRONÓMICA & DOMICILIOS

BK Delivery es un sistema empresarial integral y robusto diseñado para la administración operativa, financiera, de inventario, punto de venta (POS), control de caja y domicilios de un negocio gastronómico con inspiración de cocina alemana gourmet.

El sistema está construido siguiendo las mejores prácticas de ingeniería de software, arquitectura monolítica modular, persistencia relacional en **PostgreSQL** mediante **TypeORM**, backend reactivo en **NestJS**, y frontend corporativo con **Next.js**, **React**, **TypeScript** y **Tailwind CSS**.

---

## 🛠️ Stack Tecnológico Oficial

### Backend
- **Framework:** NestJS (Node.js + TypeScript).
- **Base de Datos:** PostgreSQL con TypeORM (Entidades, índices, llaves foráneas y transacciones ACID).
- **Seguridad:** Autenticación con JWT, cifrado de contraseñas con Bcrypt, Guards de roles (`ADMIN`, `EMPLOYEE`, `DELIVERY`).
- **Validación:** `class-validator` y `class-transformer` con validación estricta de DTOs.
- **Documentación API:** OpenAPI / Swagger disponible en `/api/docs`.
- **Reportes:** Generación de matrices en Microsoft Excel con `exceljs`.

### Frontend
- **Framework:** Next.js (App Router) con React y TypeScript.
- **Estilos:** Tailwind CSS con paleta corporativa de inspiración alemana (Negro carbón `#0c0d0e`, Rojo `#dc2626`, Dorado `#f59e0b`, Blanco y Gris oscuro).
- **Iconografía:** Lucide React.
- **Gráficos Financieros:** Recharts (Áreas, barras y tortas interactivas).
- **Formularios:** React Hook Form + Zod.
- **Estado Asíncrono:** TanStack Query (`@tanstack/react-query`) y cliente Axios con interceptores JWT.

### Infraestructura & DevOps
- **Docker & Docker Compose:** Orquestación de servicios (`postgres`, `redis`, `backend`, `frontend`).
- **Nginx:** Proxy inverso configurable.
- **Control de Versiones:** Git.

---

## 📂 Arquitectura del Proyecto

```text
proyecto_real/
├── .gitignore
├── .env.example
├── .env
├── README.md
├── docker-compose.yml
├── docker/
│   ├── postgres/
│   │   └── init.sql
│   └── nginx/
│       └── nginx.conf
├── backend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── test/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── config/               # Conexión TypeORM y variables de entorno
│       ├── common/               # Guards, decoradores, filtros globales y enums
│       ├── database/             # Semillas iniciales automáticas
│       ├── auth/                 # Autenticación JWT y Passport
│       ├── users/                # Administración de usuarios y roles
│       ├── categories/           # Categorías de menú
│       ├── products/             # Catálogo de productos, recetas y SKU
│       ├── inventory/            # Kardex de existencias y descuento atómico
│       ├── sales/                # Punto de Venta (POS) y transacciones
│       ├── payments/             # Conciliación y métodos de pago mixtos
│       ├── cash-register/        # Arqueo de caja y separación de transferencias
│       ├── expenses/             # Registro categorizado de gastos operativos
│       ├── delivery/             # Despacho y asignación a motorizados
│       ├── invoices/             # Impresión multi-formato y desacoplamiento DIAN
│       ├── reports/              # Exportación de reportes a Excel
│       └── audit/                # Registro de auditoría
└── frontend/
    ├── Dockerfile
    ├── Dockerfile.dev
    ├── package.json
    ├── tsconfig.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── postcss.config.mjs
    ├── public/
    └── src/
        ├── app/
        │   ├── (auth)/login/     # Autenticación y acceso
        │   ├── (dashboard)/
        │   │   ├── dashboard/    # KPIs ejecutivos en tiempo real
        │   │   ├── pos/          # Punto de Venta táctil interactivo
        │   │   ├── products/     # Catálogo de productos y categorías
        │   │   ├── inventory/    # Kardex y movimientos de inventario
        │   │   ├── cash/         # Apertura, arqueo y cierre de caja
        │   │   ├── expenses/     # Gastos operacionales
        │   │   ├── finances/     # Estado de resultados y margen neto
        │   │   ├── invoices/     # Facturación e impresión de tickets
        │   │   ├── delivery/     # Tablero Kanban de domicilios
        │   │   ├── reports/      # Centro de descargas Excel
        │   │   └── users/        # Administración de usuarios
        ├── components/           # Sidebar, Navbar y Layouts
        ├── lib/                  # Axios, Auth Context, Query Provider y formateadores
        ├── types/                # Interfaces TypeScript sincronizadas
        └── styles/               # CSS global y reglas @media print
```

---

## ⚡ Reglas Críticas de Negocio Implementadas

1. **Separación Contable Estricta en Caja:**
   - Las ventas cobradas en efectivo incrementan el efectivo esperado del turno.
   - Las ventas cobradas por **Transferencia (Nequi, Daviplata, Bancolombia)** o **Tarjeta** se registran y auditan de forma separada y **NUNCA se suman al efectivo físico de la caja**.
2. **Deducción de Inventario Atómica e Idempotente:**
   - La deducción de existencias se ejecuta dentro de la misma transacción de la venta mediante bloqueos pesimistas (`pessimistic_write`).
   - Se valida la clave de referencia de venta para prevenir doble descuento de stock por reintentos de red.
3. **Cálculo Financiero Preciso (CMV vs Utilidad Real):**
   - El sistema calcula el Costo de Mercancía Vendida (CMV) con base en el costo unitario congelado al momento de la venta.
   - Utilidad Bruta = Ingresos Totales - Costo CMV.
   - Utilidad Neta = Utilidad Bruta - Gastos Operacionales.
4. **Impresión Multi-Formato & Facturación Electrónica DIAN:**
   - Soporte nativo mediante reglas `@media print` para tickets térmicos de **80 mm**, **58 mm** y papel comercial **8.5 × 13 pulgadas**.
   - Arquitectura canónica desacoplada para transmitir el payload al Proveedor Tecnológico Autorizado (PTA) de la DIAN sin confundir un comprobante comercial POS con una factura electrónica con código CUFE.

---

## 🚀 Puesta en Marcha y Ejecución

### Opción 1: Ejecución con Docker Compose (Recomendada)

1. Iniciar Docker Desktop en el sistema.
2. Ejecutar en la raíz del proyecto:
   ```bash
   docker-compose up --build
   ```
3. Acceder a las aplicaciones:
   - **Frontend Next.js:** [http://localhost:3000](http://localhost:3000)
   - **Backend API NestJS:** [http://localhost:4000/api](http://localhost:4000/api)
   - **Swagger OpenAPI:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

### Opción 2: Ejecución Local en Entorno de Desarrollo

#### 1. Base de Datos PostgreSQL
Asegurarse de tener PostgreSQL corriendo en el puerto `5432` con una base de datos llamada `bk_delivery`.

#### 2. Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```
*Al iniciar, el sistema ejecutará automáticamente las semillas iniciales (usuarios, categorías iniciales Bebidas, Comidas, Entradas, Picadas, Adicionales y productos alemanes gourmet).*

#### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Credenciales Predeterminadas del Sistema

El sistema cuenta con botones de acceso demo en la pantalla de inicio de sesión:

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@bkdelivery.com` | `Admin123!` | Acceso completo (Finanzas, Reportes, Usuarios, Configuración). |
| **EMPLOYEE** | `cajero@bkdelivery.com` | `Cajero123!` | Operación POS, Caja, Ventas, Inventario, Gastos. |
| **DELIVERY** | `repartidor@bkdelivery.com` | `Repartidor123!` | Despacho, visualización y cambio de estados de pedidos en ruta. |

---

## 🧪 Pruebas Automatizadas

Para ejecutar las pruebas unitarias y de reglas de negocio en el backend:

```bash
cd backend
npm test
```
