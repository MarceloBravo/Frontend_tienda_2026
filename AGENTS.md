# Directrices de Desarrollo para IA - Proyecto React.js

Este documento define las reglas estrictas de arquitectura, estilo de código y buenas prácticas que deben seguirse en este proyecto React.

## 1. Stack Tecnológico y Principios Fundamentales
- **Librería UI:** React (última versión estable) con **Functional Components** y Hooks.
- **Estilos:** Esta aplicación utiliza exclusivamente CSS, los archivos de hojas de estilos deben estar escritos en archivos CSS Modules a excepción de los archivos src/App.css e src/index.css ya que son archivos con estilos globales.
- **Principios de Arquitectura:**
  - **Separación de responsabilidades:** Lógica de negocio separada de la UI (Custom Hooks para lógica y llamadas a APIs).
  - **Componentes Atómicos / Modulares:** Componentes pequeños, reutilizables y con una única responsabilidad (Single Responsibility Principle).
  - **Inmutabilidad:** Tratar el estado de React como inmutable.

## 2. Estructura de Directorios (Feature-First o Modular)
La estructura del proyecto debe organizarse por por tipos técnicos ya que es una aplicación demo pequeña 

## 3. Guías de Código y Buenas Prácticas en React
- **Nombres y Convenciones:**
  - Componentes: PascalCase.
  - Custom Hooks: camelCase empezando por `use` (ej. `useAuth.ts`).
  - Utilidades y constantes: UPPER_SNAKE_CASE para constantes globales.
- **Gestión de Estado:**
  - Usar `useState` o `useReducer` para estado local de componentes.
  - Elevar el estado (*Lifting State Up*) solo cuando sea estrictamente necesario.
  - Usar Context API o librerías de estado global (Zustand) solo para estados verdaderamente globales (sesión de usuario, tema, etc.).
- **Efectos Secundarios (`useEffect`):**
  - Minimizar el uso de `useEffect`. No usarlo para transformar datos que se pueden calcular en el renderizado.
  - Asegurar siempre el array de dependencias correcto para evitar bucles infinitos o renders innecesarios.
- **Optimización y Rendimiento:**
  - Evitar la sobre-optimización prematura con `useMemo` o `useCallback`, utilizarlos únicamente para cálculos pesados o referencias estables pasadas a componentes hijos fuertemente optimizados.
  - Dividir código (*Code Splitting*) usando `React.lazy` y `Suspense` en las rutas principales.

## 4. Manejo de Errores
- **Null Safety:** Manejar siempre estados de carga (`isLoading`) y estados vacíos o nulos en las vistas para evitar errores de renderizado en runtime.

## 5. Pruebas y Calidad (Si aplica)
- Escribir pruebas unitarias para custom hooks y componentes críticos utilizando herramientas como Vitest y React Testing Library, los test deben ubicarse utilizando la arquitectura de colocación (test en el mismo directorio del componente a testear).
- Mantener el código limpio, sin console.logs de depuración ni código comentado innecesario antes de proponer cambios.