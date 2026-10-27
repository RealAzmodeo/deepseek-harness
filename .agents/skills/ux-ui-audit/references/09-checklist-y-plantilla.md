# Checklist de auditoría y plantilla de informe

## Parte A · Checklist ejecutable

Se recorre **en orden**. Los bloques 1–3 son eliminatorios: si falla uno, se
reporta como crítico antes de seguir con el pulido.

### Bloque 1 · Accesibilidad (eliminatorio)

- [ ] Contraste de texto ≥ 4.5:1 (3:1 en grande), medido **en cada estado**.
- [ ] Contraste no textual ≥ 3:1: bordes de control, iconos con significado,
      **anillo de foco**.
- [ ] Foco visible con `:focus-visible` + `outline`; no recortado por `overflow`.
- [ ] Recorrido completo solo con teclado, sin trampas, con orden lógico.
- [ ] Nombre accesible en todo control, incluidos los de solo icono.
- [ ] `label` asociado en cada campo; errores con `aria-describedby`.
- [ ] Modal con trampa de foco, `Escape` y devolución del foco al disparador.
- [ ] Regiones vivas (`role="status"`, `role="alert"`) en los cambios dinámicos.
- [ ] Zoom 200% y reflow a 320px sin pérdida de contenido.
- [ ] `prefers-reduced-motion` respetado.
- [ ] El color nunca es el único canal.
- [ ] Objetivos ≥ 24×24 CSS px; 44×44 como objetivo táctil.
- [ ] `lang`, título de página y jerarquía de encabezados correctos.

### Bloque 2 · Dark patterns (eliminatorio)

- [ ] Ninguna acción destructiva sin confirmación específica.
- [ ] La opción segura tiene el mismo peso visual que la arriesgada.
- [ ] Ninguna casilla de consentimiento preseleccionada.
- [ ] Rechazar consentimiento cuesta lo mismo que aceptarlo.
- [ ] Ningún contador, stock o prueba social sin dato real.
- [ ] La baja de un servicio es tan fácil como el alta.
- [ ] Ningún microcopy que culpabilice o meta miedo.
- [ ] Ningún texto legal degradado por diseño.

### Bloque 3 · Integridad de datos (eliminatorio)

- [ ] Los datos del usuario sobreviven a cualquier error.
- [ ] Las acciones destructivas tienen deshacer o confirmación tipada.
- [ ] No hay doble envío posible.
- [ ] Las operaciones con efecto externo no usan interfaz optimista.

### Bloque 4 · Estados y resiliencia

- [ ] Los 5 estados existen: ideal, vacío, carga, error, edge cases.
- [ ] El estado vacío explica y ofrece la acción primaria.
- [ ] El vacío por filtro se distingue del vacío de primer uso.
- [ ] El skeleton reserva el espacio del contenido final.
- [ ] Existe estado de error de red, distinto del de validación.
- [ ] Todo error tiene acción de recuperación.
- [ ] Probado con texto larguísimo, 0/1/muchos ítems y valores extremos.
- [ ] Fechas, números y monedas usan `Intl`.
- [ ] Sin RTL/i18n roto (propiedades lógicas).

### Bloque 5 · Heurísticas y leyes

- [ ] H1 Visibilidad del estado: feedback en < 1s, indicador > 1s.
- [ ] H2 Mundo real: lenguaje del usuario, orden lógico.
- [ ] H3 Control y libertad: cancelar, deshacer, `Escape`.
- [ ] H4 Consistencia: mismo componente, mismo comportamiento.
- [ ] H5 Prevención de errores: validación en `blur`, restricciones de entrada.
- [ ] H6 Reconocer antes que recordar: nada que memorizar entre pasos.
- [ ] H7 Flexibilidad: atajos y acciones en lote donde aporten.
- [ ] H8 Minimalismo: densidad informativa alta, cromo visual bajo.
- [ ] H9 Recuperación de errores: causa y solución en lenguaje llano.
- [ ] H10 Ayuda contextual donde surge la duda.
- [ ] **Gestalt:** proximidad, similitud, región común, continuidad,
      figura-fondo, conexión uniforme.
- [ ] **Cognitivas:** Fitts, Hick, Miller (con chunking real), Jakob, Tesler,
      Doherty (< 400ms o feedback), Von Restorff (un solo CTA primario).

### Bloque 6 · Tokens y arquitectura CSS

- [ ] Fuente de tokens única, en formato DTCG, versionada.
- [ ] Tres capas presentes; los componentes consumen solo 2 y 3.
- [ ] Cero literales: `#hex`, `px` sueltos, `ms`, `cubic-bezier` en componentes.
- [ ] Cero `!important`.
- [ ] z-index dentro de la escala; los conflictos se resuelven con contextos.
- [ ] Dark mode reasigna tokens, no reglas.
- [ ] Sin tokens huérfanos ni duplicados con distinto nombre.
- [ ] Pares texto/fondo verificados en ambos temas.
- [ ] El CSS generado no se edita a mano.

### Bloque 7 · Componentes

- [ ] Un único punto de importación; sin imports desde rutas internas.
- [ ] Ficha por componente: propósito, estados, tokens, a11y.
- [ ] Variantes como uniones cerradas, no booleanos acumulables.
- [ ] Sin prop `color` arbitraria.
- [ ] Container queries en lugar de media queries de componente.
- [ ] Sin reimplementar primitivos nativos peor.
- [ ] Átomos sin conocimiento del dominio.

### Bloque 8 · Material y glass (si aplica)

- [ ] Material: roles `sys`, no primitivos `ref`.
- [ ] Material: una sola semántica de elevación (tonal **o** sombra, no ambas).
- [ ] Material: *state layers*, no `:hover { background }`.
- [ ] Material: pares `on-*` sin cruzar; targets ≥ 48dp.
- [ ] M3E no aplicado a producto denso sin recomponer densidad.
- [ ] Glass: ≤ 3 superficies concurrentes, `blur()` ≤ 16px por defecto.
- [ ] Glass: sin anidamiento; con borde de 1px y doble sombra.
- [ ] Glass: `-webkit-backdrop-filter` y fallback en `@supports not`.
- [ ] Glass: degrada a sólido con `prefers-reduced-transparency`,
      `prefers-contrast: more` y `forced-colors: active`.
- [ ] Glass: ningún texto de cuerpo sin scrim.
- [ ] Glass: sin ancestros con `opacity < 1` ni `will-change` sobre el panel.

### Bloque 9 · Movimiento

- [ ] Duraciones 150–300ms en interacción.
- [ ] Se animan `transform` y `opacity`, no `width`/`height`/`top`/`left`.
- [ ] Sin animación de `backdrop-filter`.
- [ ] Curvas de easing desde tokens, no inventadas.
- [ ] Sin animación decorativa infinita.

### Bloque 10 · Higiene

- [ ] Sin listeners, timers u observers huérfanos.
- [ ] Sin referencias a elementos eliminados.
- [ ] Sin `style=""` en línea.
- [ ] Sin `position: absolute` estructurando el layout.
- [ ] Sin `100vh` (usar `100dvh`).
- [ ] Sin alturas fijas sobre contenido variable.

### Bloque 11 · Responsive, adaptativo y mobile-first

- [ ] El CSS base es el de pantalla pequeña y los cortes usan `min-width`.
- [ ] Breakpoints justificados por el contenido y documentados.
- [ ] Componentes reutilizables con container queries, no media queries.
- [ ] Cero `100vh` y cero `100vw` para anchuras.
- [ ] `min-width: 0` donde el hijo de flex/grid debe encogerse.
- [ ] `clamp()` con máximo ≥ 2× el mínimo, en `rem`.
- [ ] Imágenes con `srcset`, `sizes` correcto y dimensiones explícitas.
- [ ] Viewport sin `user-scalable=no`; `viewport-fit=cover` con `env()`.
- [ ] Controles con `font-size` ≥ 16px, `inputmode` y `autocomplete`.
- [ ] `:hover` solo dentro de `@media (hover: hover)`.
- [ ] Nada esencial oculto con `display: none` en móvil.
- [ ] Tablas con una estrategia responsive explícita.
- [ ] Probado a 320px, con zoom 200%, en ambas orientaciones y en dispositivo
      real.

### Bloque 12 · Rendimiento

- [ ] Las tres métricas medidas en **campo** (p75), no solo en laboratorio.
- [ ] Ningún `loading="lazy"` en el elemento del LCP.
- [ ] El hero existe en el HTML inicial, no inyectado por JavaScript.
- [ ] Fuentes con `font-display` y overrides de métricas.
- [ ] Ningún `<script>` sincrónico en el `<head>`.
- [ ] Terceros inventariados y diferidos.
- [ ] El trabajo pesado cede el hilo o se mueve a un Worker.
- [ ] Nada anima propiedades de layout.
- [ ] Listas largas con virtualización o `content-visibility` +
      `contain-intrinsic-size`.
- [ ] Listeners de scroll y táctiles pasivos y limitados por frame.
- [ ] Sin reflows forzados en bucles.
- [ ] Existe presupuesto de rendimiento y se hace cumplir en CI.

### Bloque 13 · Revisión técnica

- [ ] Cada interacción usa el elemento nativo correcto.
- [ ] Landmarks únicos, un solo `h1`, sin saltos de nivel.
- [ ] Tablas con `caption` y `scope`; formularios con `fieldset`/`legend`.
- [ ] La tarea principal funciona sin JavaScript.
- [ ] Orden de `@layer` declarado una vez; sin `!important` ni estilos en línea.
- [ ] Todo listener, timer, observador y `fetch` tiene su baja.
- [ ] Sin `catch` vacíos ni condiciones de carrera.
- [ ] Sin `innerHTML` con datos del usuario; `rel="noopener"` donde toca.
- [ ] `Intl` para lo formateable; sin concatenar textos; propiedades lógicas.
- [ ] Consola limpia en la tarea principal.

---

## Parte B · Plantilla de informe

El formato es **obligatorio** y en este orden. No se añaden secciones, no se
reordena.

````md
## Diagnóstico UX/UI

<!-- Un bloque por hallazgo, ordenados por severidad (crítico → bajo). -->

### [CRÍTICO] Contraste insuficiente en texto secundario
- **Ubicación:** `src/components/Card.css:31`
- **Evidencia:** `color: #94a3b8` sobre `--color-surface` → 2.6:1 medido.
- **Ley / criterio violado:** WCAG 2.2 SC 1.4.3 AA (mínimo 4.5:1).
- **Anti-patrón:** `B-01`
- **Usuario afectado:** baja visión, uso en exterior, pantallas de bajo contraste.
- **Impacto:** el texto secundario es ilegible; el usuario no distingue metadatos.

### [MEDIO] La etiqueta queda equidistante de dos campos
- **Ubicación:** `src/components/Form.css:12-18`
- **Evidencia:** `gap: 16px` tanto dentro del campo como entre campos.
- **Ley violada:** Proximidad (Gestalt); H5 Prevención de errores.
- **Usuario afectado:** cualquiera rellenando el formulario.
- **Impacto:** errores de entrada en el campo contiguo.

## Tokens/Variables Requeridas

<!-- Solo los tokens nuevos o reutilizados que usa la corrección. -->

```css
/* Nuevo en la capa semántica: texto secundario con 4.6:1 verificado. */
--color-text-muted: oklch(44.6% 0.043 257); /* era --prim-neutral-400 */

/* Nuevo en la capa de componente. */
--field-gap: var(--space-inline-xs);     /* 4px: etiqueta pegada a su campo */
--form-gap: var(--space-stack-lg);       /* 24px: separación entre campos */
```

## Solución y Estructura

<!-- Qué cambia y por qué, en prosa breve. Sin teoría. -->

Se separa el espaciado interno del campo (4px) del espaciado entre campos (24px)
usando dos tokens distintos, de modo que la proximidad exprese la relación. El
gris del texto secundario sube un paso en la escala para cumplir AA sin perder la
jerarquía respecto al texto principal.

## Código Corregido

<!-- Solo los bloques modificados, autocontenidos y difeables. Nunca el archivo
     entero. Sin literales. Sin !important. Con los estados cubiertos. -->

```css
/* Card.css — solo el bloque modificado */
.card__meta {
  color: var(--color-text-muted);
}

/* Form.css — solo el bloque modificado */
.field { display: grid; gap: var(--field-gap); }
.form { display: grid; gap: var(--form-gap); }
```
````

### Reglas del informe

1. **Orden por severidad**, no por orden de aparición en el archivo.
2. **Archivo y línea reales.** Si no se ha leído el archivo, no se cita.
3. Cada hallazgo nombra **la ley, la heurística o el criterio** que viola.
4. Cada hallazgo cita el **ID del registro de anti-patrones**.
5. El "Código Corregido" **no contiene** ningún anti-patrón del registro.
6. Sin introducciones, sin resumen de teoría, sin "en mi opinión".
7. Al cerrar: verificar que no quedan listeners, timers u observers huérfanos ni
   referencias a elementos eliminados.

### Severidad

| Nivel | Criterio | Cuándo |
| --- | --- | --- |
| **Crítico** | Bloquea el uso, pierde datos, es ilegible o inaccesible, o es un dark pattern | Siempre se corrige |
| **Alto** | Fricción medible en la tarea principal; deuda estructural | Se corrige en el mismo cambio |
| **Medio** | Fricción perceptible, pulido ausente | Se corrige o se planifica |
| **Bajo** | Acabado sin impacto funcional | Se menciona sin inflarlo |

**No infles y no diluyas.** Un flujo roto es crítico; un píxel desalineado no lo
es. Un informe donde todo es crítico no se lee.
