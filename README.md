# Tienda 2026 - Frontend

Aplicación web de comercio electrónico desarrollada con **React** que consume una API REST en Node.js. Permite explorar productos, buscar, ver el detalle, marcar favoritos, autenticarse y administrar el catálogo de productos (rol `admin`), incluyendo la subida de imágenes con compresión en el navegador.

## Características principales

- **Catálogo de productos:** listado en la página principal con búsqueda por texto.
- **Detalle de producto:** vista individual por ID con imagen, precio, rating y descripción.
- **Favoritos:** se persisten en `localStorage` y se reflejan en el contador del menú.
- **Autenticación JWT:** login y registro con access token en memoria y refresh token en cookie; el interceptor de Axios renueva el token automáticamente ante un `401`.
- **Rutas protegidas:** el mantenedor de productos requiere sesión activa y rol `admin` (redirige a `/login` o `/unauthorized` según corresponda).
- **Mantenedor de productos (CRUD):** formulario con validación completa, preview de imagen, compresión automática, barra de progreso y manejo de errores del servidor.
- **Validación de formularios:** `react-hook-form` + `zod`, con errores inline por campo e indicador de fortaleza de contraseña.
- **Estados de UI:** carga (`Spinner`), vacío y error (`EmptyState`) en las vistas principales; notificaciones tipo *toast* con Zustand.
- **Code splitting:** rutas cargadas con `React.lazy` + `Suspense`.

## Stack tecnológico

| Área | Tecnología |
| --- | --- |
| UI | React 19, CSS Modules |
| Build / tooling | Create React App (`react-scripts` 5) |
| Ruteo | React Router 7 |
| HTTP | Axios |
| Formularios | react-hook-form + Zod 4 (`@hookform/resolvers`) |
| Estado global | Context API + Zustand (toasts) |
| Imágenes | browser-image-compression |
| Tests | Jest (react-scripts) + React Testing Library + jest-dom |

## Estructura de directorios

La organización es por tipo técnico. Los tests se colocan junto al archivo que prueban (arquitectura de colocación).

```text
.
├── .github/workflows/        # CI/CD (deploy a Netlify)
├── public/                   # Archivos estáticos públicos
├── src/
│   ├── assets/               # Imágenes y recursos importados por componentes
│   ├── axios/
│   │   └── axiosInstance.js  # Instancia de Axios, interceptores y refresh token
│   ├── components/           # Componentes reutilizables (con sus tests colocados)
│   │   ├── emptyState/       # Estado vacío/error reutilizable
│   │   ├── header/           # Menú, navegación, búsqueda y sesión (MenuComponent)
│   │   ├── PasswordStrengthIndicator/
│   │   ├── productCard/      # Tarjeta de producto + hook useProductCard
│   │   ├── spinner/
│   │   └── toast/
│   │       ├── ToastComponent/   # Toast individual + hook useToastComponent
│   │       └── ToastContainer/   # Contenedor de toasts
│   ├── contexts/             # Estado global: AuthContext, ProductContext, AppProviders
│   ├── hooks/                # Hooks genéricos (useHttp)
│   ├── pages/                # Vistas por funcionalidad
│   │   ├── home/             # Listado y búsqueda de productos
│   │   ├── DetalleProducto/
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── MantenedorProducto/
│   │   │   ├── MantenedorProductoList/
│   │   │   └── MantenedorProductoForm/
│   │   ├── Page403/          # Acceso no autorizado
│   │   └── Page404/          # Ruta no encontrada
│   ├── routes/               # Navigation (lazy/Suspense) y ProtectedRoutes
│   ├── store/                # Store de Zustand para toasts
│   ├── utils/                # Axios, refresh token, manejo de imágenes
│   ├── App.js                # Layout principal
│   ├── App.css / index.css   # Estilos globales
│   ├── index.js              # Punto de entrada
│   └── setupTests.js         # Configuración de Jest + polyfills
├── .env.ejemplo              # Variables de entorno de referencia
├── Dockerfile                # Entorno de desarrollo
├── Dockerfile.prod           # Build multi-stage + Nginx
├── docker-compose.yml        # Servicio de desarrollo (puerto 5173)
└── nginx.conf                # Configuración de Nginx para producción
```

## Rutas de la aplicación

| Ruta | Vista | Acceso |
| --- | --- | --- |
| `/` | Home: listado y búsqueda | Público |
| `/detalle-producto/:id` | Detalle de producto | Público |
| `/login` | Inicio de sesión | Público |
| `/register` | Registro de usuario | Público |
| `/admin-producto` | Listado del mantenedor | `admin` |
| `/admin-producto/nuevo` | Crear producto | `admin` |
| `/admin-producto/editar/:id` | Editar producto | `admin` |
| `/unauthorized` | Acceso denegado (403) | Público |
| `*` | Página no encontrada (404) | Público |

## Requisitos previos

- **Node.js 20 o superior** (los Dockerfiles usan `node:20-alpine`).
- **npm** (incluido con Node).
- El **backend** de la tienda en ejecución (por defecto en `http://localhost:3000`).
- El **backend** de la aplicación se encuentra disponible en el repositorio [https://github.com/MarceloBravo/backend_tienda_2026.git](https://github.com/MarceloBravo/backend_tienda_2026.git)

## Clonar y ejecutar en local

```powershell
git clone https://github.com/MarceloBravo/Frontend_tienda_2026.git
cd Frontend_tienda_2026
npm install
```

Crear el archivo de variables de entorno a partir del ejemplo y ajustar la URL del backend:

```powershell
Copy-Item .env.ejemplo .env
```

```dotenv
REACT_APP_API_URL=http://localhost:3000
```

Iniciar el servidor de desarrollo:

```powershell
npm start
```

La aplicación queda disponible en `http://localhost:3000` (puerto por defecto de CRA). Si el backend ya ocupa el puerto `3000`, iniciá el frontend en otro puerto:

```powershell
$env:PORT=5173; npm start
```

En Bash:

```bash
PORT=5173 npm start
```

## Variables de entorno

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `REACT_APP_API_URL` | URL base del backend (API y archivos estáticos) | `http://localhost:3000` |
| `PORT` | Puerto del servidor de desarrollo (opcional) | `5173` |

> Las variables deben comenzar con `REACT_APP_` para ser expuestas por CRA. No se deben commitear secretos en `.env`.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `build/` |
| `npm test` | Tests en modo interactivo (watch) |
| `npm run eject` | Expone la configuración de CRA (irreversible) |

## Ejecutar los tests

El proyecto usa **Jest** (integrado en `react-scripts`) y **React Testing Library**. Los tests están colocados en el mismo directorio que el componente u hook que prueban.

Ejecución única (CI) en PowerShell:

```powershell
$env:CI='true'; npm test -- --watchAll=false
```

En Bash:

```bash
CI=true npm test -- --watchAll=false
```

Ejecutar solo un archivo o patrón:

```powershell
$env:CI='true'; npm test -- --watchAll=false --testPathPattern="MenuComponent"
```

Modo interactivo (watch) durante el desarrollo:

```powershell
npm test
```

### Cobertura actual

**17 suites, 143 tests**, cubriendo camino feliz, casos límite (valores nulos/indefinidos, cadenas vacías, listas vacías, `localStorage` corrupto) y escenarios de error (fallos y timeouts de API, logout fallido, formularios inválidos).

| Sujetos bajo test |
| --- |
| `App` (smoke test, estados vacío y error) |
| `MenuComponent` + `useMenuComponent` |
| `ProductCard` + `useProductCard` |
| `ProtectedRoutes` |
| `useHttp` |
| `ToastComponent`, `ToastContainer`, `useToastComponent` |
| `EmptyStateComponent`, `SpinnerComponent`, `PasswordStrengthIndicator` |
| `useLoginPage`, `useRegisterPage` |
| `useMantenedorProductoListPage`, `useMantenedorProductoFormPage` |

## Docker

Desarrollo (usa `Dockerfile`, expone el puerto `5173` y define `REACT_APP_API_URL`):

```powershell
docker compose up --build
```

Producción (build multi-stage y Nginx en el puerto 80, con proxy de `/api/` hacia el backend):

```powershell
docker build -f Dockerfile.prod -t tienda-frontend .
docker run -p 80:80 tienda-frontend
```

## Despliegue

El repositorio incluye el workflow `.github/workflows/deploy-netlify.yml` para desplegar automáticamente en Netlify.
