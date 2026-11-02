# Tienda 2026 - Frontend

Aplicación web de comercio electrónico desarrollada con **React** que consume una API REST en Node.js. Permite explorar productos, buscar, ver el detalle, marcar favoritos, autenticarse, gestionar un carrito y administrar el catálogo de productos (rol `admin`), incluyendo el checkout con integración a WebPay y la subida de imágenes con compresión en el navegador.

## Características principales

- **Catálogo de productos:** listado en la página principal con búsqueda por texto y paginación.
- **Detalle de producto:** vista individual por ID con imagen, precio, rating y descripción.
- **Favoritos:** se persisten en `localStorage` y se reflejan en el contador del menú.
- **Autenticación JWT:** login y registro con access token en memoria y refresh token en cookie; el interceptor de Axios renueva el token automáticamente ante un `401`.
- **Rutas protegidas:** el mantenedor de productos requiere sesión activa y rol `admin` (redirige a `/login` o `/unauthorized` según corresponda).
- **Mantenedor de productos (CRUD):** formulario con validación completa, preview de imagen, compresión automática, barra de progreso y manejo de errores del servidor.
- **Carrito y checkout:** carrito persistente, formulario de despacho validado y redirección a WebPay.
- **Validación de formularios:** esquemas con **Zod**, errores inline por campo e indicador de fortaleza de contraseña.
- **Estados de UI:** carga (`Spinner`), vacío y error (`EmptyState`) en las vistas principales; notificaciones tipo *toast* con Zustand.
- **Code splitting:** rutas cargadas con `React.lazy` + `Suspense`.

## Stack tecnológico

| Área | Tecnología |
| --- | --- |
| UI | React 19 + CSS Modules |
| Build / tooling | Create React App (`react-scripts` 5) |
| Ruteo | React Router 7 |
| HTTP | Axios |
| Estado global | Zustand 5 (sesión, carrito, productos, modal y toasts) |
| Formularios y validación | Zod 4 + manejo controlado de formularios |
| Autenticación | JWT (`jwt-decode`, access token en memoria + refresh token en cookie) |
| Imágenes | browser-image-compression |
| Feedback visual | react-spinners |
| Tests | Jest (react-scripts) + React Testing Library + jest-dom |
| Calidad de código | ESLint (configuración `react-app`) |
| Contenedores | Docker + Nginx (producción) |
| CI/CD | GitHub Actions + Netlify |

## Estructura de directorios

La organización es por tipo técnico. Los tests se colocan junto al archivo que prueban (arquitectura de colocación).

```text
.
├── .github/workflows/        # CI/CD (deploy a Netlify)
├── public/                   # Archivos estáticos públicos
├── src/
│   ├── api/                  # Llamadas a endpoints de pagos
│   ├── assets/               # Imágenes y recursos importados por componentes
│   ├── axios/
│   │   └── axiosInstance.js  # Instancia de Axios, interceptores y refresh token
│   ├── components/           # Componentes reutilizables (con sus tests colocados)
│   │   ├── accordion/
│   │   ├── emptyState/       # Estado vacío/error reutilizable
│   │   ├── footer/
│   │   ├── header/           # Menú, navegación, búsqueda y sesión (MenuComponent)
│   │   ├── modal/
│   │   ├── pagination/
│   │   ├── PasswordStrengthIndicator/
│   │   ├── productCard/      # Tarjeta de producto + hook useProductCard
│   │   ├── searchProduct/
│   │   ├── shoppingCart/     # Panel del carrito + hook useShoppingCartComponent
│   │   ├── spinner/
│   │   └── toast/
│   │       ├── ToastComponent/   # Toast individual + hook useToastComponent
│   │       └── ToastContainer/   # Contenedor de toasts
│   ├── hooks/                # Hooks genéricos (useHttp)
│   ├── pages/                # Vistas por funcionalidad
│   │   ├── home/             # Listado, búsqueda y paginación de productos
│   │   ├── DetalleProducto/
│   │   ├── favorites/        # Productos favoritos
│   │   ├── checkout/         # Carrito, despacho y pago
│   │   ├── PagoResultado/    # Resultado del pago en WebPay
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── MantenedorProducto/
│   │   │   ├── MantenedorProductoList/
│   │   │   └── MantenedorProductoForm/
│   │   ├── Page403/          # Acceso no autorizado
│   │   └── Page404/          # Ruta no encontrada
│   ├── routes/               # Navigation (lazy/Suspense) y ProtectedRoutes
│   ├── store/                # Stores de Zustand (auth, productos, carrito, modal, toasts)
│   ├── utils/                # Imágenes, direcciones, WebPay y respuestas de API
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
| `/` | Home: listado, búsqueda y paginación | Público |
| `/detalle-producto/:id` | Detalle de producto | Público |
| `/favorites` | Productos favoritos | Público |
| `/checkout` | Carrito y formulario de despacho | Público (requiere sesión al pagar) |
| `/pago/resultado` | Resultado del pago WebPay | Público |
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
- **Git** para clonar el repositorio.
- El **backend** de la tienda en ejecución (por defecto en `http://localhost:3000`).
  - Repositorio: [https://github.com/MarceloBravo/backend_tienda_2026.git](https://github.com/MarceloBravo/backend_tienda_2026.git)
- **Docker y Docker Compose** (opcional, solo si se ejecutará en contenedores).

## Clonación e implementación para desarrollo

### 1. Clonar el repositorio

```powershell
git clone https://github.com/MarceloBravo/Frontend_tienda_2026.git
cd Frontend_tienda_2026
```

### 2. Instalar las dependencias

```powershell
npm install
```

Para una instalación reproducible basada en `package-lock.json` (por ejemplo, en CI), usar:

```powershell
npm ci
```

### 3. Configurar las variables de entorno

Crear el archivo `.env` a partir del ejemplo:

```powershell
Copy-Item .env.ejemplo .env
```

En Bash:

```bash
cp .env.ejemplo .env
```

El contenido esperado es:

```dotenv
REACT_APP_API_URL=http://localhost:3000
PORT=3001
```

Ajustar `REACT_APP_API_URL` si el backend se ejecuta en otra URL o puerto.

### 4. Levantar el backend

El frontend consume la API REST del backend. Antes de iniciar la aplicación, clonar y ejecutar el backend según sus instrucciones:

```powershell
git clone https://github.com/MarceloBravo/backend_tienda_2026.git
cd backend_tienda_2026
npm install
npm start
```

El backend debe quedar disponible en `http://localhost:3000` (o en la URL configurada en `REACT_APP_API_URL`).

### 5. Iniciar el servidor de desarrollo

```powershell
npm start
```

La aplicación queda disponible en `http://localhost:3001` según el `PORT` definido en `.env`. Create React App abre el navegador automáticamente y recarga la página ante cada cambio.

Si el puerto configurado está ocupado, se puede iniciar en otro puerto:

```powershell
$env:PORT=5173; npm start
```

En Bash:

```bash
PORT=5173 npm start
```

> Si no se define `PORT`, Create React App usa el puerto `3000`, que por defecto ocupa el backend. Por eso el archivo `.env.ejemplo` utiliza `3001`.

### 6. Verificar la integración

- Abrir `http://localhost:3001` y comprobar que el catálogo carga productos.
- Probar el login con un usuario del backend.
- Para acceder al mantenedor, la sesión debe tener rol `admin`.

## Variables de entorno

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `REACT_APP_API_URL` | URL base del backend (API y archivos estáticos) | `http://localhost:3000` |
| `PORT` | Puerto del servidor de desarrollo (opcional) | `3001` |

> Las variables deben comenzar con `REACT_APP_` para ser expuestas por CRA. No se deben commitear secretos en `.env`; el archivo está excluido por `.gitignore`.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `build/` |
| `npm test` | Tests en modo interactivo (watch) |
| `npm run eject` | Expone la configuración de CRA (irreversible) |

## Ejecutar los tests

El proyecto usa **Jest** (integrado en `react-scripts`) y **React Testing Library**. Los tests están colocados en el mismo directorio que el componente, hook, store o utilidad que prueban, y cubren camino feliz, casos límite (valores nulos/indefinidos, cadenas vacías, listas vacías, `localStorage` corrupto) y escenarios de error (fallos y timeouts de API, formularios inválidos).

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

## Docker

### Desarrollo

El `docker-compose.yml` construye la imagen desde `Dockerfile`, expone el puerto `5173` y define `REACT_APP_API_URL`:

```powershell
docker compose up --build
```

La aplicación queda disponible en `http://localhost:5173`. Si el backend también se ejecuta en Docker, ajustar `REACT_APP_API_URL` a la URL del servicio correspondiente.

### Producción

Build multi-stage (Node + Nginx) con proxy de `/api/` hacia el backend:

```powershell
docker build -f Dockerfile.prod -t tienda-frontend .
docker run -p 80:80 tienda-frontend
```

La imagen de producción sirve la aplicación en el puerto `80` y aplica `nginx.conf` para el ruteo de React Router, caché de assets y compresión gzip.

## Build y despliegue

Generar el build de producción:

```powershell
npm run build
```

El resultado queda en `build/`. Las variables `REACT_APP_*` se incorporan en tiempo de build, por lo que deben estar definidas antes de ejecutar el comando.

El repositorio incluye el workflow `.github/workflows/deploy-netlify.yml`, que instala dependencias, ejecuta el build y despliega automáticamente en **Netlify** al hacer push o pull request a `main`. Requiere los secretos `NETLIFY_AUTH_TOKEN` y `NETLIFY_SITE_ID` configurados en GitHub.

## Solución de problemas

| Problema | Causa probable | Solución |
| --- | --- | --- |
| El catálogo no carga productos | Backend apagado o URL incorrecta | Verificar que el backend esté en ejecución y que `REACT_APP_API_URL` apunte a su URL |
| Error de CORS | Origen del frontend no permitido en el backend | Revisar `FRONTEND_URL` en la configuración del backend |
| El puerto ya está en uso | Otro proceso (por ejemplo, el backend) ocupa el puerto | Cambiar `PORT` en `.env` o iniciar con `PORT=5173 npm start` |
| Recargar una ruta devuelve 404 en producción | Servidor sin fallback a `index.html` | Usar la configuración de `nginx.conf` incluida o el redirect de Netlify |
| Los cambios en `.env` no se reflejan | CRA solo lee las variables al iniciar | Detener y volver a ejecutar `npm start` |
