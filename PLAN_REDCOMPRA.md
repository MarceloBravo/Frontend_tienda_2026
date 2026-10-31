# Plan de implementación — Pago con Redcompra / Webpay Plus

> **Estado:** implementado en frontend (fases 1–7 y 10 completadas); verificación manual E2E pendiente
> **Última actualización:** 2026-10-30
>
> **Leyenda de estado:** ✅ realizado · ⏳ pendiente · ⏭️ omitido (opcional/fuera de alcance)
> **Alcance:** frontend `talentosp-tienda-Frontend` + ajustes mínimos en `talentosp-tienda-backend`.
> **Decisiones aplicadas:** R.1 botón "Pagar con Webpay Plus" · R.2 login obligatorio (invitado diferido) · R.3 checkout con accordion y datos de envío · R.4 sin persistencia del método de pago.

---

## 0. Resumen ejecutivo

El backend ya implementa el flujo completo de Webpay Plus, producto que procesa **Redcompra (débito)** y tarjetas de crédito con el mismo endpoint. No hace falta crear una pasarela ni un endpoint nuevo para Redcompra.

El trabajo pendiente está en el frontend:

1. El botón "Pagar" actual no ejecuta ninguna acción (`handlePay` es un no-op).
2. No existe la página `/pago/resultado` a la que redirige Transbank.
3. El checkout no exige sesión, pero la API de pagos sí.
4. El total puede quedar en `0` porque el enriquecimiento del carrito solo carga la página 1 del catálogo.
5. No hay datos de envío ni validación.
6. No hay estado de carga, manejo de errores ni protección contra doble clic.

El plan resuelve esos puntos en 8 fases obligatorias + 1 fase opcional (compra como invitado) y una fase de pruebas.

---

## 1. Decisiones de diseño (R.1 – R.4)

### R.1 — Botón "Pagar con Webpay Plus"

- El botón del resumen de compra cambia de texto `Pagar` a **`Pagar con Webpay Plus`**.
- Mientras se crea la orden y se inicia la transacción: **`Redirigiendo a Webpay…`** (botón deshabilitado).
- Se elimina el bloque visual "Forma de pago" (imágenes Redcompra/Webpay) y la fila "Forma de pago" del resumen se reemplaza por un texto estático: **`Webpay Plus (débito o crédito)`**.

### R.2 — ¿Compra como invitado o login obligatorio?

**Respuesta corta:** con el backend actual la sesión es **obligatoria**. Técnicamente sí es posible habilitar la compra como invitado, pero requiere cambios de seguridad que se difieren a una fase opcional.

#### Estado actual

- `POST /api/pagos/crear-orden` y `POST /api/pagos/iniciar` están protegidos con `authenticateToken` (`src/routes/pagos.routes.js`). Sin JWT responden `401`.
- `GET /api/pagos/estado/:ordenId` también exige JWT.

#### ¿Por qué sería posible como invitado?

- `ordenes.usuario_id` es `NULL` en el esquema y `OrdenesService.crearOrden` acepta `usuarioId: null`.
- `validarPertenencia` tolera órdenes sin dueño:

```js
// src/services/ordenes.service.js
if (orden.usuario_id !== null && orden.usuario_id !== undefined) {
  if (Number(orden.usuario_id) !== Number(usuarioId)) {
    throw new AppError('No autorizado para operar sobre esta orden.', 403);
  }
}
```

#### Qué faltaría para habilitarlo con seguridad

1. Middleware `optionalAuth` en `crear-orden` e `iniciar` (o endpoints exclusivos de invitado).
2. Un mecanismo de propiedad para órdenes sin usuario. Hoy, si `usuario_id` es `NULL`, **cualquier usuario autenticado** podría consultar `/pagos/estado/:ordenId` de un invitado. Se necesitaría:
   - un token de invitado firmado (JWT corto con `ordenId` + `buyOrder`), o
   - un endpoint de resultado público validado por `buyOrder` + `token_ws`.
3. Persistir ese token en `sessionStorage` para la página de resultado (no se puede depender de la sesión).
4. Definir política de órdenes abandonadas de invitados.

#### Recomendación

**Mantener login obligatorio en esta iteración.** Ventajas:

- Reutiliza el backend tal como está, sin abrir un hueco de seguridad.
- El carrito ya persiste en `localStorage`, así que el usuario no pierde nada al ir al login.
- Solo requiere redirigir a `/login` con `state.from` y volver al checkout.

La compra como invitado queda documentada como **Fase 9 (opcional)** con su propio análisis.

### R.3 — Checkout con accordion y datos de envío

Se reemplaza el layout de secciones sueltas por un **accordion controlado** con dos pasos:

1. **Resumen de productos** (abierto por defecto).
2. **Datos de envío** (se abre al pulsar "Continuar con datos de envío" o al intentar pagar sin dirección).

La sección **"Forma de pago" se elimina** porque el botón ya define el medio de pago (Webpay Plus).

#### Campos de envío

| Campo | Obligatorio | Validación |
|---|---|---|
| `nombreDestinatario` | Sí | 1–100 caracteres |
| `telefono` | Sí | formato chileno `+56 9 1234 5678`, `9 1234 5678` o `912345678` |
| `calle` | Sí | 1–150 caracteres |
| `numero` | Sí | 1–20 caracteres (acepta `s/n`) |
| `departamento` | No | máx. 50 |
| `comuna` | Sí | 1–100 caracteres |
| `ciudad` | Sí | 1–100 caracteres |
| `region` | Sí | selector con las 16 regiones de Chile |
| `referencias` | No | máx. 200 |

#### Cómo se envía al backend

El backend solo acepta un string `direccionEnvio` (máx. 500). Para no migrar la base de datos, el frontend compone un texto legible:

```
Nombre — +56 9 1234 5678 — Calle 123, Depto 4B, Comuna, Ciudad, Región — Ref: portón azul
```

- Se trunca a 500 caracteres.
- Si más adelante se quiere una dirección estructurada, se puede guardar JSON en el mismo campo `TEXT` o agregar columnas; queda fuera de este alcance.

#### Comportamiento del accordion

- Estado controlado en `useCheckoutPage`: `openSection` (`'products' | 'shipping' | null`), por defecto `'products'`.
- `toggleSection(id)` permite abrir/cerrar; solo una sección abierta a la vez.
- El resumen de compra (columna derecha) permanece siempre visible y sticky.
- Cada cabecera muestra un subtítulo de estado: `2 productos`, `Pendiente`, `Completado`.
- Accesibilidad: botón con `aria-expanded`, `aria-controls`, panel con `role="region"` y `aria-labelledby`.

### R.4 — Sin persistencia del método de pago

- No se agrega `metodoPago` al DTO, validador, servicio ni base de datos.
- Se elimina del frontend el estado `paymentMethod` y la función `selectPayment`.
- La columna `ordenes.metodo_pago` ya existe con `ENUM('WEBPAY')` y valor por defecto `WEBPAY`; se deja intacta.
- El tipo real de tarjeta se conoce recién en el `commit` (`payment_type_code`: `VD` = débito/Redcompra, `VN`/`VC` = crédito). Se muestra en la página de resultado, pero no se persiste como preferencia del usuario.

---

## 2. Diagnóstico del estado actual

### 2.1 Backend (ya resuelto)

| Endpoint | Descripción | Respuesta |
|---|---|---|
| `POST /api/pagos/crear-orden` | Valida stock, calcula el total desde la BD y crea la orden | `{ ordenId, buyOrder, sessionId, montoTotal, estado, items }` |
| `POST /api/pagos/iniciar` | Crea la transacción en Transbank | `{ url, token, buyOrder, amount }` |
| `POST\|GET /api/pagos/retorno` | Recibe `token_ws`, ejecuta el `commit`, actualiza orden/pago y redirige | `302 → FRONTEND_URL/pago/resultado?estado=...&buyOrder=...&ordenId=...` |
| `GET /api/pagos/estado/:ordenId` | Devuelve orden + pago (voucher) | `{ orden, pago }` |

Características ya implementadas:

- Cálculo de montos en el servidor (nunca se confía en el precio del cliente).
- Validación de stock.
- Idempotencia del `commit` (`yaProcesado`).
- Manejo de timeout (`TBK_ORDEN_COMPRA` sin tokens) y cancelación (`TBK_TOKEN` sin `token_ws`).
- Persistencia de `payment_type_code`, `authorization_code`, `card_detail`, `transaction_date`, `raw_response`.
- Estados de orden: `PENDIENTE`, `PAGADO`, `RECHAZADO`, `CANCELADO`, `ANULADO`.
- Estados de pago: `INICIADO`, `AUTORIZADO`, `RECHAZADO`, `TIMEOUT`, `ERROR`.

### 2.2 Frontend (bloqueos)

1. `handlePay` no hace nada.
2. No existe `/pago/resultado` ni su página.
3. `/checkout` es público, pero la API exige JWT.
4. El total se calcula con `getAllProducts('', 1)` (solo página 1); los productos fuera de esa página quedan con precio `0` y bloquean el pago.
5. No hay estado `isProcessing`, error visible ni guard contra doble clic.
6. `useLoginPage` siempre navega a `/`, ignorando `state.from`.
7. `shoppingCartStore` no tiene `clearCart()`.
8. Al volver de Transbank la app se recarga; la sesión solo se restaura si existe refresh token en cookie (`rememberMe`).

---

## 3. Aclaración clave sobre Redcompra

Con `transbank-sdk` v6 **Redcompra se procesa con el mismo producto Webpay Plus**. No existe una clase `Redcompra` ni un endpoint separado en el SDK:

```js
// src/config/transbank.js
const { WebpayPlus, Options, Environment } = require('transbank-sdk');
return new WebpayPlus.Transaction(new Options(commerceCode, apiKey, Environment.Integration));
```

- El usuario elige débito/Redcompra en el formulario de Transbank.
- El `payment_type_code` llega en el `commit`:
  - `VD` → Débito / Redcompra
  - `VN` → Crédito
  - `VC` → Crédito en cuotas
  - `SI`, `S2`, `NC` → Cuotas sin interés
- Si el negocio exige el producto comercial "Webpay Plus Débito" con código de comercio propio, es una gestión con Transbank, no un cambio de código.

**Conclusión:** el backend actual ya soporta el pago con Redcompra. El plan se concentra en el frontend.

---

## 4. Flujo objetivo

```
[CheckoutPage]
   |
   |-- click "Pagar con Webpay Plus"
   v
[useCheckoutPage]
   |  1. valida carrito, total, dirección y sesión
   |  2. POST /api/pagos/crear-orden  -> { ordenId, montoTotal }
   |  3. POST /api/pagos/iniciar      -> { url, token }
   |  4. auto-submit form POST (token_ws) a Transbank
   v
[Transbank] usuario paga con tarjeta Redcompra/débito
   |
   |  5. Transbank -> BACKEND /api/pagos/retorno?token_ws=...
   |  6. backend commit + estados + 302
   v
[Frontend /pago/resultado?estado=...&buyOrder=...&ordenId=...]
   |  7. muestra éxito / rechazo / timeout
   |  8. si éxito -> clearCart()
   |  9. si hay sesión -> GET /api/pagos/estado/:ordenId (voucher)
```

---

## 5. Plan por fases

### Fase 0 — Configuración (sin código) — ✅ Realizado (frontend; backend a verificar)

Backend `.env`:

```env
TRANSBANK_ENVIRONMENT=integration
TRANSBANK_COMMERCE_CODE=597055555532
TRANSBANK_API_KEY=<api key de integración>
TRANSBANK_RETURN_URL=http://localhost:3000/api/pagos/retorno
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

Frontend `.env`:

```env
REACT_APP_API_URL=http://localhost:3000
PORT=3001
```

Puntos a verificar:

- El frontend debe correr en el mismo puerto que `FRONTEND_URL` (3001). Hoy el backend ocupa el 3000.
- CORS permite `FRONTEND_URL` y `FRONTEND_URL2`.
- `TRANSBANK_RETURN_URL` debe ser accesible por el navegador. En local funciona; para pruebas desde otro dispositivo o un entorno remoto se necesita una URL pública (túnel tipo ngrok).
- Credenciales de integración de Transbank (comercio `597055555532`).

**Criterio de salida:** `GET http://localhost:3000/api/health` responde y el frontend abre en `http://localhost:3001`.

> ✅ **Realizado:** se agregó `PORT=3001` en `.env` y `.env.ejemplo`. La configuración del backend (`TRANSBANK_*`, `FRONTEND_URL`) debe verificarse en el repositorio `talentosp-tienda-backend`, que no forma parte de este workspace.

---

### Fase 1 — Cliente API de pagos — ✅ Realizado

**Nuevo:** `src/api/pagosApi.js`

```js
import instance from '../axios/axiosInstance';

const unwrap = (response) => response?.data?.data;

export const crearOrden = async ({ items, direccionEnvio = null }) => {
  const response = await instance.post('/api/pagos/crear-orden', {
    items,
    ...(direccionEnvio ? { direccionEnvio } : {}),
  });
  return unwrap(response);
};

export const iniciarPago = async (ordenId) => {
  const response = await instance.post('/api/pagos/iniciar', { ordenId });
  return unwrap(response);
};

export const obtenerEstadoPago = async (ordenId) => {
  const response = await instance.get(`/api/pagos/estado/${ordenId}`);
  return unwrap(response);
};
```

- El interceptor de `axiosInstance` agrega el JWT automáticamente.
- No se envía precio ni total: el backend los calcula.
- Los errores se propagan tal cual para que el hook los traduzca.

---

### Fase 2 — Componente Accordion reutilizable — ✅ Realizado

**Nuevos:**
- `src/components/accordion/AccordionComponent.jsx`
- `src/components/accordion/AccordionComponent.module.css`
- `src/components/accordion/AccordionComponent.test.jsx`

API del componente:

```jsx
<AccordionComponent
  id="shipping"
  title="Datos de envío"
  subtitle={shippingComplete ? 'Completado' : 'Pendiente'}
  isOpen={openSection === 'shipping'}
  onToggle={() => toggleSection('shipping')}
>
  <ShippingForm ... />
</AccordionComponent>
```

Implementación mínima:

```jsx
export const AccordionComponent = ({ id, title, subtitle, isOpen, onToggle, children }) => {
  const headerId = `accordion-header-${id}`;
  const panelId = `accordion-panel-${id}`;

  return (
    <section className={styles.accordion}>
      <h2 className={styles.heading}>
        <button
          type="button"
          id={headerId}
          className={styles.trigger}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className={styles.title}>{title}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          <span
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>
      </h2>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        hidden={!isOpen}
        className={styles.panel}
      >
        {children}
      </div>
    </section>
  );
};
```

CSS: tarjeta blanca, borde `#e5e7eb`, radio 8px, botón sin estilos nativos, chevron rotado, transición suave.

Tests:
- Renderiza título y subtítulo.
- `aria-expanded` cambia al hacer clic.
- El panel está oculto cuando `isOpen=false`.
- Llama `onToggle` una vez por clic.
- Navegación por teclado (el `<button>` nativo ya la da; verificar `Enter`/`Space` con `userEvent`).

---

### Fase 3 — Datos de envío (schema + utilidades) — ✅ Realizado

**Nuevo:** `src/pages/checkout/CheckoutSchema.js`

Patrón del proyecto (igual que `RegisterSchema.js`): `zod` + `safeParse` en el hook.

```js
import { z } from 'zod';

const telefonoRegex = /^(\+?56)?\s?9\s?\d{4}\s?\d{4}$/;

export const CheckoutSchema = z.object({
  nombreDestinatario: z.string().trim().min(1, 'El campo es requerido').max(100),
  telefono: z.string().trim().regex(telefonoRegex, 'Teléfono inválido (ej: +56 9 1234 5678)'),
  calle: z.string().trim().min(1, 'El campo es requerido').max(150),
  numero: z.string().trim().min(1, 'El campo es requerido').max(20),
  departamento: z.string().trim().max(50).optional().or(z.literal('')),
  comuna: z.string().trim().min(1, 'El campo es requerido').max(100),
  ciudad: z.string().trim().min(1, 'El campo es requerido').max(100),
  region: z.string().trim().min(1, 'Selecciona una región'),
  referencias: z.string().trim().max(200).optional().or(z.literal('')),
});

export const REGIONES = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  "O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes',
  'Metropolitana',
];
```

**Nuevo:** `src/utils/direccionEnvio.js`

```js
export const MAX_DIRECCION_ENVIO = 500;

export const composeDireccionEnvio = (shipping = {}) => {
  const linea = [
    shipping.nombreDestinatario,
    shipping.telefono,
    [
      shipping.calle,
      shipping.numero,
      shipping.departamento ? `, ${shipping.departamento}` : '',
    ].filter(Boolean).join(' '),
    shipping.comuna,
    shipping.ciudad,
    shipping.region,
  ]
    .filter(Boolean)
    .join(' — ');

  const referencias = shipping.referencias ? ` — Ref: ${shipping.referencias}` : '';
  return `${linea}${referencias}`.slice(0, MAX_DIRECCION_ENVIO);
};
```

**Nuevo:** `src/pages/checkout/ShippingForm.jsx` + `ShippingForm.module.css`

- Recibe `values`, `errors`, `onChange`.
- Campos controlados, `aria-invalid`, `aria-describedby` para el mensaje de error.
- Select de región alimentado con `REGIONES`.
- Grid responsive: dos columnas en desktop, una en móvil.
- Reutiliza los estilos de inputs del proyecto (mismos colores y bordes).

**Nuevo:** `src/pages/checkout/ShippingForm.test.jsx`

---

### Fase 4 — Lógica del checkout — ✅ Realizado

**Modificar:** `src/pages/checkout/useCheckoutPage.js`

#### 4.1 Enriquecimiento correcto del carrito

Reemplazar `getAllProducts('', 1)` por una carga por producto:

```js
const getProduct = useProductStore((store) => store.getProduct);

useEffect(() => {
  if (!Array.isArray(productsInCart) || productsInCart.length === 0) {
    navigate('/', { replace: true });
    return;
  }

  const cargar = async () => {
    const entries = await Promise.all(
      productsInCart.map(async (item) => {
        try {
          const product = await getProduct(item.productId);
          return [item.productId, product];
        } catch {
          return [item.productId, null];
        }
      })
    );
    setEnriched(Object.fromEntries(entries.filter(([, product]) => product)));
  };

  cargar();
}, [productsInCart, getProduct, navigate]);
```

Esto corrige el total en `0` cuando hay productos fuera de la primera página.

#### 4.2 Estado de la UI

```js
const [openSection, setOpenSection] = useState('products');
const [isProcessing, setIsProcessing] = useState(false);
const [payError, setPayError] = useState(null);
const [shipping, setShipping] = useState({
  nombreDestinatario: '',
  telefono: '',
  calle: '',
  numero: '',
  departamento: '',
  comuna: '',
  ciudad: '',
  region: '',
  referencias: '',
});
const [shippingErrors, setShippingErrors] = useState({});
```

#### 4.3 Handlers

```js
const toggleSection = (section) => {
  setOpenSection((current) => (current === section ? null : section));
};

const handleShippingChange = (event) => {
  const { name, value } = event.target;
  const next = { ...shipping, [name]: value };
  setShipping(next);

  const result = CheckoutSchema.safeParse(next);
  setShippingErrors(result.success ? {} : mapZodErrors(result.error));
};

const shippingComplete = CheckoutSchema.safeParse(shipping).success;
```

`mapZodErrors` transforma `error.issues` en `{ campo: 'mensaje' }` (mismo patrón que `RegisterPage`).

#### 4.4 `handlePay`

```js
const handlePay = async () => {
  if (isProcessing) return;

  if (!shippingComplete) {
    setOpenSection('shipping');
    return;
  }

  if (!userSession?.isLoggedIn) {
    navigate('/login', { state: { from: { pathname: '/checkout' } } });
    return;
  }

  setIsProcessing(true);
  setPayError(null);

  try {
    const orden = await crearOrden({
      items: items.map((item) => ({ asin: item.productId, cantidad: item.cant })),
      direccionEnvio: composeDireccionEnvio(shipping),
    });
    const pago = await iniciarPago(orden.ordenId);
    redirectToWebpay(pago);
    // No se resetea isProcessing: el navegador sale de la app.
  } catch (error) {
    setPayError(
      error.response?.data?.message || 'No se pudo iniciar el pago. Intenta nuevamente.'
    );
    setIsProcessing(false);
  }
};
```

#### 4.5 `canPay`

```js
const canPay = total > 0 && shippingComplete && !isProcessing;
```

Ya no depende de `paymentMethod`.

#### 4.6 Return del hook

```js
return {
  items,
  total,
  openSection,
  toggleSection,
  shipping,
  shippingErrors,
  handleShippingChange,
  shippingComplete,
  canPay,
  isProcessing,
  payError,
  incrementProduct,
  decrement,
  handlePay,
};
```

**Nuevo:** `src/utils/webpay.js`

```js
export const redirectToWebpay = ({ url, token }) => {
  if (!url || !token) {
    throw new Error('Respuesta de Webpay incompleta.');
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'token_ws';
  input.value = token;

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  form.remove();
};
```

> Webpay Plus espera un **POST con `token_ws`**. No usar `window.location.href = url?token_ws=...`.

---

### Fase 5 — UI del checkout — ✅ Realizado

**Modificar:** `src/pages/checkout/CheckoutPage.jsx`

Estructura objetivo:

```jsx
<div className={styles.mainGrid}>
  <div className={styles.leftColumn}>
    <AccordionComponent
      id="products"
      title="Resumen de productos"
      subtitle={`${items.length} producto(s)`}
      isOpen={openSection === 'products'}
      onToggle={() => toggleSection('products')}
    >
      {/* tabla actual */}
      <button
        type="button"
        className={styles.continueButton}
        onClick={() => toggleSection('shipping')}
      >
        Continuar con datos de envío
      </button>
    </AccordionComponent>

    <AccordionComponent
      id="shipping"
      title="Datos de envío"
      subtitle={shippingComplete ? 'Completado' : 'Pendiente'}
      isOpen={openSection === 'shipping'}
      onToggle={() => toggleSection('shipping')}
    >
      <ShippingForm
        values={shipping}
        errors={shippingErrors}
        onChange={handleShippingChange}
      />
    </AccordionComponent>
  </div>

  <aside className={styles.rightColumn}>
    <section className={styles.summarySection}>
      <h2 className={styles.sectionTitle}>Resumen de compra</h2>
      <div className={styles.summaryRow}>
        <span>Total</span>
        <span className={styles.totalAmount}>{formatPrice(total)}</span>
      </div>
      <div className={styles.summaryRow}>
        <span>Medio de pago</span>
        <span className={styles.paymentName}>Webpay Plus (débito o crédito)</span>
      </div>
      {payError && (
        <p className={styles.payError} role="alert">
          {payError}
        </p>
      )}
      <button
        type="button"
        className={styles.payButton}
        disabled={!canPay}
        onClick={handlePay}
      >
        {isProcessing ? 'Redirigiendo a Webpay…' : 'Pagar con Webpay Plus'}
      </button>
      {!shippingComplete && (
        <p className={styles.helperText}>
          Completa los datos de envío para continuar.
        </p>
      )}
    </section>
  </aside>
</div>
```

Cambios adicionales:

- Eliminar imports de `redcompraImg`, `webpayImg` y los assets si no se usan en otra parte.
- Eliminar del hook `paymentMethod` y `selectPayment`.
- **CSS:** borrar `.paymentOptions`, `.paymentOption`, `.hiddenCheckbox`, `.paymentImage`; agregar `.continueButton`, `.payError`, `.helperText` y los estilos del accordion (en su propio módulo).
- El resumen sigue siendo sticky en desktop; en móvil pasa a estático.
- El botón se deshabilita también mientras `isProcessing`.

**Modificar:** `src/pages/checkout/CheckoutPage.module.css`

---

### Fase 6 — Página de resultado — ✅ Realizado

**Nuevos:**
- `src/pages/PagoResultado/PagoResultadoPage.jsx`
- `src/pages/PagoResultado/usePagoResultadoPage.js`
- `src/pages/PagoResultado/PagoResultadoPage.module.css`

Hook:

```js
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { useShoppingCartStore } from '../../store/shoppingCartStore';
import { obtenerEstadoPago } from '../../api/pagosApi';

export const usePagoResultadoPage = () => {
  const [searchParams] = useSearchParams();
  const estado = searchParams.get('estado');
  const buyOrder = searchParams.get('buyOrder') || '';
  const ordenId = Number(searchParams.get('ordenId')) || null;

  const isLoggedIn = useAuthStore((store) => store.userSession.isLoggedIn);
  const clearCart = useShoppingCartStore((store) => store.clearCart);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    if (estado === 'success') {
      clearCart();
    }
  }, [estado, clearCart]);

  useEffect(() => {
    if (!ordenId || !isLoggedIn) return;

    obtenerEstadoPago(ordenId)
      .then(setDetalle)
      .catch(() => {
        // La sesión pudo expirar al volver de Transbank: el resultado igual se muestra.
      });
  }, [ordenId, isLoggedIn]);

  return { estado, buyOrder, ordenId, detalle };
};
```

Vistas:

| `estado` | Contenido |
|---|---|
| `success` | "Pago autorizado". Monto, N° de orden, `buyOrder`, código de autorización, últimos 4 dígitos y tipo de tarjeta. Botón "Volver al inicio". |
| `fail` | "Pago rechazado". Botón "Reintentar" → `/checkout` (el carrito se conserva). |
| `timeout` | "Tiempo de pago agotado". Botón "Reintentar". |
| ausente/inválido | Mensaje genérico + enlace al inicio. |

Detalles:

- `detalle.orden.monto_total` y `detalle.pago.authorization_code`, `card_detail`, `payment_type_code`.
- Mapa de tipo de tarjeta: `VD` → "Débito / Redcompra"; `VN`/`VC` → "Crédito"; `SI`/`S2`/`NC` → "Cuotas sin interés".
- La página debe funcionar **sin sesión** (la app se recarga al volver de Transbank y la sesión puede no restaurarse).
- No redirigir aunque el carrito esté vacío.

**Modificar:** `src/store/shoppingCartStore.js`

```js
clearCart: () => {
  writeJSON(CART_STORAGE_KEY, { products: [], productsInCart: 0 });
  set({ products: [], productsInCart: 0 });
},
```

---

### Fase 7 — Router y retorno al checkout — ✅ Realizado

**Modificar:** `src/routes/Navigation.jsx`

```jsx
const PagoResultadoPage = lazy(() =>
  import('../pages/PagoResultado/PagoResultadoPage')
    .then((module) => ({ default: module.PagoResultadoPage }))
);

<Route path="/pago/resultado" element={<PagoResultadoPage />} />
```

Ruta pública, fuera de `ProtectedRoutes`.

**Modificar:** `src/pages/Login/useLoginPage.jsx`

```js
import { useLocation, useNavigate } from 'react-router';

const location = useLocation();

useEffect(() => {
  if (userSession?.isLoggedIn) {
    const from = location.state?.from;
    const destino = typeof from === 'string' ? from : from?.pathname || '/';
    navigate(destino, { replace: true });
  }
}, [userSession?.isLoggedIn, navigate, location.state]);
```

Así, si el usuario pulsa "Pagar con Webpay Plus" sin sesión, va al login y vuelve al checkout con el carrito intacto.

---

### Fase 8 — Endurecimiento del backend (opcional, P2) — ⏭️ Omitido (backend fuera de este repo)

No es necesario para que Redcompra funcione.

1. **Rechazar el inicio de una orden ya pagada.** En `TransbankService.iniciarTransaccion`, si `orden.estado === 'PAGADO'`, lanzar `AppError` 409. Hoy `validarPertenencia` no lo impide.
2. **Reutilizar la orden pendiente** del mismo usuario/carrito para evitar órdenes abandonadas al reintentar.
3. **Test adicional** de `construirUrlFrontend` para validar los query params y el caso `ordenId=null`.

> R.4 descarta persistir el método de pago, así que no se toca `metodoPago`.

---

### Fase 9 — Compra como invitado (opcional, fuera de esta iteración) — ⏭️ Omitido (decisión R.2)

Solo si el negocio decide habilitarla:

1. `optionalAuth` en `crear-orden` e `iniciar`.
2. Token de invitado firmado (JWT corto con `ordenId` + `buyOrder`) o endpoint de resultado público validado por `buyOrder` + `token_ws`.
3. Persistir el token en `sessionStorage` y enviarlo a `/pago/resultado`.
4. Tests de seguridad: un invitado no puede consultar órdenes de otro.
5. Política de limpieza de órdenes abandonadas.

---

### Fase 10 — Pruebas — ✅ Realizado (frontend: 342 tests en verde)

Siguiendo `AGENTS.md`: camino feliz + casos límite + error, con tests colocados junto al código.

#### Frontend

| Archivo | Casos |
|---|---|
| `AccordionComponent.test.jsx` | render, `aria-expanded`, panel oculto, toggle, teclado |
| `CheckoutSchema.test.js` | dirección válida; campos vacíos; teléfono inválido; strings al máximo; opcionales vacíos |
| `direccionEnvio.test.js` | composición normal; sin opcionales; exactamente 500; recorte a 500 |
| `useCheckoutPage.test.js` | carga por producto (no página 1); total correcto; `handlePay` feliz (crear + iniciar + redirect); sin sesión → login; dirección incompleta → abre envío; error de API → `payError`; doble clic → una llamada; carrito vacío → redirección |
| `CheckoutPage.test.jsx` | dos accordions; "Forma de pago" ya no existe; botón "Pagar con Webpay Plus"; deshabilitado sin dirección; texto "Redirigiendo…"; alerta de error |
| `PagoResultadoPage.test.jsx` | success/fail/timeout; parámetros faltantes; `clearCart` solo en success; fallo de `/estado` no rompe la vista |
| `webpay.test.js` | form con `method=POST`, `action=url`, input `token_ws`; respuesta incompleta lanza error |
| `shoppingCartStore.test.js` | `clearCart` vacía estado y `localStorage` |

#### Backend

- Los tests actuales de `transbank.controller` y `transbank.service` cubren el flujo.
- Agregar el test de `construirUrlFrontend` (Fase 8.3) si se implementa.
- Si se agrega la validación de orden pagada, su test correspondiente.

#### Comandos

```bash
# Frontend
npm test -- --watchAll=false

# Backend
npm test
```

---

### Fase 11 — Verificación manual E2E — ⏳ Pendiente (requiere backend + Transbank)

1. Backend en `3000`, frontend en `3001`.
2. Agregar productos al carrito y abrir `/checkout`.
3. Verificar los dos accordions y que "Forma de pago" ya no exista.
4. Completar los datos de envío y comprobar que el botón se habilita.
5. Pulsar **Pagar con Webpay Plus**.
6. En Network:
   - `POST /api/pagos/crear-orden` → `201` con `ordenId` y `montoTotal`.
   - `POST /api/pagos/iniciar` → `200` con `url` y `token`.
   - `POST` a `webpay3gint.transbank.cl` con `token_ws`.
7. Pagar en el simulador con una tarjeta de **débito de prueba** (tabla oficial de tarjetas de prueba de Webpay Plus).
8. Verificar el `302` a `/pago/resultado?estado=success...`.
9. Confirmar en BD:
   - `ordenes.estado = 'PAGADO'`
   - `pagos_transbank.status = 'AUTORIZADO'`
   - `pagos_transbank.payment_type_code = 'VD'`
   - `ordenes.direccion_envio` contiene la dirección compuesta.
10. Repetir con tarjeta rechazada, cancelación y timeout.
11. Confirmar que el carrito se vacía solo en éxito.
12. Probar el flujo sin sesión: debe redirigir a login y volver al checkout.

---

## 6. Contratos de datos

| Llamada | Request | Response (`data`) |
|---|---|---|
| Crear orden | `{ items: [{ asin, cantidad }], direccionEnvio? }` | `{ ordenId, buyOrder, sessionId, montoTotal, estado, items }` |
| Iniciar pago | `{ ordenId }` | `{ url, token, buyOrder, amount }` |
| Retorno | Transbank → backend | `302 /pago/resultado?estado=success\|fail\|timeout&buyOrder=...&ordenId=...` |
| Estado | `GET /api/pagos/estado/:ordenId` | `{ orden, pago }` |

Notas:

- `items[].asin` se obtiene de `item.productId` del carrito (el carrito guarda el ASIN).
- El backend recalcula precios y valida stock; el total del frontend es solo referencial.
- `direccionEnvio` se envía como string compuesto de máximo 500 caracteres.

---

## 7. Estructura de archivos

```
src/
├── api/
│   └── pagosApi.js                        (nuevo)
├── components/
│   └── accordion/
│       ├── AccordionComponent.jsx         (nuevo)
│       ├── AccordionComponent.module.css  (nuevo)
│       └── AccordionComponent.test.jsx    (nuevo)
├── pages/
│   ├── checkout/
│   │   ├── CheckoutPage.jsx               (modificado)
│   │   ├── CheckoutPage.module.css        (modificado)
│   │   ├── CheckoutSchema.js              (nuevo)
│   │   ├── CheckoutSchema.test.js         (nuevo)
│   │   ├── ShippingForm.jsx               (nuevo)
│   │   ├── ShippingForm.module.css        (nuevo)
│   │   ├── ShippingForm.test.jsx          (nuevo)
│   │   ├── useCheckoutPage.js             (modificado)
│   │   └── useCheckoutPage.test.js        (nuevo/ampliado)
│   ├── PagoResultado/
│   │   ├── PagoResultadoPage.jsx          (nuevo)
│   │   ├── PagoResultadoPage.module.css   (nuevo)
│   │   ├── PagoResultadoPage.test.jsx     (nuevo)
│   │   └── usePagoResultadoPage.js        (nuevo)
│   └── Login/
│       └── useLoginPage.jsx               (modificado)
├── routes/
│   └── Navigation.jsx                     (modificado)
├── store/
│   └── shoppingCartStore.js               (modificado: clearCart)
└── utils/
    ├── direccionEnvio.js                  (nuevo)
    ├── direccionEnvio.test.js             (nuevo)
    ├── webpay.js                          (nuevo)
    └── webpay.test.js                     (nuevo)
```

---

## 8. Casos borde

- Usuario no autenticado al pulsar el botón.
- Carrito vacío o con cantidades `0`.
- Producto eliminado o sin stock entre el checkout y el pago → `400`/`404` del backend.
- Total `0` por fallo de enriquecimiento → bloquear con mensaje claro.
- Producto del carrito fuera de la primera página del catálogo (corregido en Fase 4.1).
- Dirección incompleta → abrir el accordion de envío y no llamar a la API.
- Teléfono con formato inválido o texto que excede los máximos.
- `direccionEnvio` compuesta mayor a 500 caracteres → truncar.
- Doble clic o reintento rápido → `isProcessing` + guard.
- Error de red al crear la orden o al iniciar la transacción.
- Cancelación en Transbank (`TBK_TOKEN` sin `token_ws`) → `estado=fail`.
- Timeout (`TBK_ORDEN_COMPRA` sin tokens) → `estado=timeout`.
- Retorno con `ordenId` nulo (cancelación sin pago registrado).
- Sesión expirada al volver de Transbank → la página de resultado funciona igual.
- Recarga de `/pago/resultado` → el backend es idempotente y la página no repite el commit.

---

## 9. Criterios de aceptación

- [x] El checkout muestra dos accordions: "Resumen de productos" y "Datos de envío".
- [x] La sección "Forma de pago" ya no existe.
- [x] El botón dice "Pagar con Webpay Plus" y se deshabilita sin dirección válida o mientras procesa.
- [x] La dirección se valida con `zod` y se envía compuesta al backend.
- [x] El botón inicia el flujo real y redirige al formulario de Webpay.
- [ ] Se puede pagar con tarjeta de débito/Redcompra en integración. ⏳ (verificación manual)
- [ ] El backend registra `payment_type_code = VD`. ⏳ (verificación manual)
- [ ] La orden queda `PAGADO` y el pago `AUTORIZADO`; en rechazo, `RECHAZADO`. ⏳ (verificación manual)
- [x] `/pago/resultado` muestra éxito, rechazo o timeout correctamente.
- [x] El carrito se vacía solo tras un pago autorizado.
- [x] Sin sesión, el usuario va al login y regresa al checkout.
- [x] No se generan órdenes duplicadas por doble clic.
- [x] No se persiste el método de pago.
- [x] Todos los tests nuevos pasan junto con la suite existente.

---

## 10. Riesgos y decisiones abiertas

| Tema | Riesgo | Mitigación |
|---|---|---|
| Puerto del frontend | Si corre en `3000` choca con el backend y CORS/redirect fallan | Fijar `PORT=3001` |
| Sesión tras volver de Transbank | Sin `rememberMe` no hay refresh token y la sesión se pierde | La página de resultado no exige sesión; el voucher es opcional |
| Órdenes abandonadas | Cada reintento crea una orden nueva | Aceptable para la demo; Fase 8.2 opcional |
| Dirección como string | Menos estructurada para reportería | Se puede migrar a JSON/columnas después |
| Compra como invitado | Requiere cambios de seguridad | Diferida a Fase 9 |
| Monto mostrado vs. real | El frontend muestra un total referencial | Usar `montoTotal` del backend en la confirmación |

### Preguntas para el negocio

1. ¿La dirección de envío es obligatoria para todo Chile o solo para algunas regiones?
2. ¿Se requiere teléfono de contacto obligatorio?
3. ¿Se quiere compra como invitado en el corto plazo? (Si sí, priorizar Fase 9.)
4. ¿Se necesita mostrar el voucher completo o basta con estado + número de orden?

---

## 11. Orden de ejecución y estimación

| Fase | Descripción | Estimación |
|---|---|---|
| 0 | Configuración y verificación de entornos | 0,5 h |
| 1 | Cliente API de pagos | 1 h |
| 2 | Componente Accordion + tests | 2 h |
| 3 | Schema, utilidades y ShippingForm + tests | 3 h |
| 4 | Lógica del checkout (`handlePay`, enriquecimiento) | 3 h |
| 5 | UI del checkout y limpieza de CSS | 2 h |
| 6 | Página de resultado + `clearCart` | 3 h |
| 7 | Router y retorno al checkout | 1 h |
| 8 | Endurecimiento backend (opcional) | 1 h |
| 10 | Pruebas y ajustes | 3 h |
| 11 | Verificación manual E2E | 1 h |
| **Total** | | **~20,5 h** |

**Sugerencia de entrega:** implementar en dos PRs.

1. **PR 1:** Fases 0–5 (checkout con accordion, envío y botón que inicia el pago).
2. **PR 2:** Fases 6–7 + pruebas E2E (página de resultado, router y retorno al login).

---

> **Nota final:** Redcompra no requiere un endpoint nuevo. El backend ya está listo; el valor de este plan está en conectar el botón, capturar la dirección de envío, manejar los estados de la transacción y mostrar el resultado al usuario.
