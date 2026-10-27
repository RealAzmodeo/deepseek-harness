# Revisión técnica: HTML, CSS y JavaScript

Una auditoría UX mira **lo que el usuario percibe**. Una revisión técnica mira **lo
que sostiene esa percepción**: semántica correcta, mejora progresiva, arquitectura
de estilos y ciclo de vida del código. Las dos se hacen juntas, pero no son lo
mismo: un componente puede verse perfecto y ser inaccesible, o pasar todos los
contrastes y filtrar memoria en cada desmontaje.

## 1. Semántica HTML

El HTML correcto es la mitad de la accesibilidad y la mitad del SEO. No es una
preferencia de estilo.

| Necesidad | Elemento correcto | Anti-patrón |
| --- | --- | --- |
| Navegar a otra URL | `<a href>` | `<div onclick>` (`R-01`, `R-02`) |
| Ejecutar una acción | `<button type="button">` | `<a href="#">` con handler |
| Enviar un formulario | `<button type="submit">` | `<div>` con `onclick` |
| Abrir/cerrar | `<details>`/`<summary>` o `<dialog>` | `div` con estado propio |
| Agrupar campos | `<fieldset>` + `<legend>` | `div` con un título suelto |
| Datos tabulares | `<table>` con `<caption>`, `<th scope>` | Grid de `div` |
| Lista de elementos | `<ul>`/`<ol>`/`<li>` | Serie de `div` |
| Encabezado de sección | `<h2>`…`<h6>` en orden | `<div class="title">` |

**Reglas duras:**

- Un solo `<h1>`; sin saltos de nivel.
- Landmarks presentes y únicos: `header`, `nav`, `main`, `footer`.
- `<title>` descriptivo y único por vista.
- `lang` en `<html>` y en cualquier fragmento en otro idioma (`R-19`).
- Las tablas de datos llevan `<caption>` y `scope` en las cabeceras (`R-04`).
- Los grupos de controles relacionados llevan `<fieldset>`/`<legend>` (`R-05`).
- `<dialog>` nativo antes que un modal casero: trae foco, `Escape` y `::backdrop`.

**Por qué importa:** los lectores de pantalla navegan por encabezados, listas y
tablas. Un `<div>` no tiene rol, no es navegable y no se anuncia. Reconstruirlo
con ARIA cuesta más y se rompe antes.

---

## 2. Mejora progresiva

Orden de dependencia: **HTML → CSS → JS**. Cada capa debe aportar valor sin las
siguientes.

| Se comprueba | Cómo |
| --- | --- |
| La página funciona **sin JavaScript** | Desactivar JS en el navegador y recorrer la tarea principal |
| La página funciona **sin CSS** | Desactivar estilos: el orden de lectura debe seguir teniendo sentido (`R-18`) |
| La página funciona **sin `backdrop-filter`** | `@supports not` |
| La página funciona **sin `@container`** | El layout degrada a una columna razonable |
| La página funciona **sin red** | Estado de error explícito y reintento |

**Regla:** si el contenido esencial (navegación, texto, precios, formulario)
depende de JavaScript para existir, es un hallazgo. Renderizar en servidor o
enviar HTML real no es una optimización: es un requisito de robustez y de
accesibilidad.

---

## 3. Arquitectura CSS

### Capas y especificidad

```css
/* Orden declarado UNA vez, en el entrypoint. */
@layer tokens, base, layout, components, utilities;
```

| Regla | Motivo |
| --- | --- |
| El orden de `@layer` se declara una vez | A partir de ahí, especificidad y orden de aparición dejan de importar |
| `:where()` para scoping | Aporta 0 de especificidad: se puede sobrescribir sin pelear |
| Anidación máxima de 3 niveles | Más allá, el selector es frágil (`R-12`) |
| Cero `!important` | Rompe la cascada y el theming (`J-03`) |
| Cero estilos en línea | Esquivan tokens y estados (`J-02`) |
| Estilos encapsulados por componente | Nada se filtra al exterior (`R-14`, `K-08`) |

### Organización

```
styles/
  tokens.css        generado; importado una vez
  reset.css         box-sizing, márgenes, medios
  base.css          tipografía y elementos base
  layout/           shell, grid, contenedores
  components/       un fichero por componente
  utilities/        helpers de una sola responsabilidad
```

**Higiene obligatoria:** sin CSS muerto, sin reglas duplicadas, sin selectores
que no casan con nada, sin dos frameworks de utilidades a la vez (`Q-10`).

---

## 4. Ciclo de vida en JavaScript

La mayor fuente de defectos técnicos en una interfaz no es la lógica: es lo que
**no se limpia**.

| Recurso | Se abre con | Se cierra con |
| --- | --- | --- |
| Listener | `addEventListener` | `removeEventListener` con la **misma** referencia, o `AbortController` |
| Intervalo | `setInterval` | `clearInterval` |
| Timeout | `setTimeout` | `clearTimeout` |
| Observador | `new MutationObserver` / `IntersectionObserver` / `ResizeObserver` | `disconnect()` |
| Petición | `fetch` | `AbortController.abort()` al desmontar (`R-09`) |
| Suscripción | `subscribe` / `on` | La función de baja que devuelve |
| Worker / canal | `new Worker` / `MessageChannel` | `terminate()` / `close()` |

```js
// Patrón correcto: una sola señal aborta todo el ciclo de vida del componente.
const controller = new AbortController()
const { signal } = controller

window.addEventListener('scroll', onScroll, { signal, passive: true })
const observer = new IntersectionObserver(onIntersect)
observer.observe(node)

return () => {
  controller.abort()   // listeners y fetch caen con ella
  observer.disconnect()
  clearTimeout(debounceId)
}
```

### Defectos que se buscan siempre

| Defecto | Cómo se detecta | Por qué daña |
| --- | --- | --- |
| Listener huérfano (`R-08`) | `addEventListener` sin baja en el desmontaje | Fuga de memoria y handlers que actúan sobre nodos muertos |
| Timer huérfano (`R-08`) | `setInterval` sin `clear` | Consumo continuo y estado actualizado tras desmontar |
| Observador sin `disconnect` (`R-08`) | Grep | Fuga y callbacks sobre elementos eliminados |
| `fetch` sin abortar (`R-09`) | Grep | Respuestas que llegan tarde y pisan estado nuevo |
| Condición de carrera (`R-10`) | Dos peticiones que pueden resolverse en cualquier orden | Se muestra el resultado equivocado |
| `catch` vacío (`R-11`) | Grep de `catch {}` | El error desaparece y el usuario ve una interfaz congelada |
| Reflow forzado (`Q-11`) | Lectura de `offsetHeight`/`getBoundingClientRect` dentro de un bucle | Layout thrashing: decenas de recálculos por frame |
| Listener no pasivo (`Q-12`) | `scroll`/`touchmove`/`wheel` sin `{ passive: true }` | Bloquea el scroll |
| Handler de scroll sin límite (`Q-13`) | Sin throttle/`requestAnimationFrame` | Tareas largas y caída de FPS |

**Regla de cierre:** antes de dar por buena una corrección, se verifica que no
queden listeners, timers u observers huérfanos ni referencias a elementos
eliminados. Es el último paso del formato de salida.

---

## 5. Seguridad básica de interfaz

No es una auditoría de seguridad, pero hay defectos que un revisor de UI debe
detectar siempre:

| Defecto | Detección | Riesgo |
| --- | --- | --- |
| `innerHTML` con datos del usuario (`R-06`) | Grep de `innerHTML`/`dangerouslySetInnerHTML` | XSS |
| `target="_blank"` sin `rel="noopener"` (`R-07`) | Grep | La página destino controla `window.opener` |
| Contenido mixto HTTP en página HTTPS | Consola | Bloqueo de recursos y aviso de inseguridad |
| `autocomplete="off"` en login | Grep | Rompe gestores de contraseñas (3.3.8) |
| Datos sensibles en la URL o en logs | Inspección | Filtración por historial y telemetría |
| Permisos pedidos sin contexto | Inspección | Rechazo permanente y desconfianza |

---

## 6. Internacionalización

| Requisito | Correcto | Anti-patrón |
| --- | --- | --- |
| Formato de números, fechas y moneda | `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat` | Concatenar y formatear a mano (`G-10`) |
| Textos | Diccionario con claves; nunca concatenar fragmentos (`R-15`) | `'Hola ' + nombre + ', tienes ' + n + ' mensajes'` |
| Plurales | `Intl.PluralRules` | `n === 1 ? 'mensaje' : 'mensajes'` |
| Dirección | Propiedades lógicas: `margin-inline-start`, `inset-inline` (`R-16`) | `margin-left`/`right` |
| Declaración | `<html lang="es" dir="rtl">` (`R-19`) | Sin `lang` |
| Longitud | Sin anchos fijos; probar con texto 40% más largo | `width: 200px` sobre una etiqueta |
| Imágenes con texto | Texto real, no imagen | Banner con el mensaje incrustado |

---

## 7. Qué se puede verificar automáticamente y qué no

| Se automatiza bien | Exige ojo humano |
| --- | --- |
| Validez del HTML y del CSS | Si el elemento elegido es el semánticamente correcto |
| Contraste en pares simples | Contraste sobre imágenes, gradientes, glass y estados |
| `alt` presente | Si el `alt` es pertinente |
| `label` presente | Si el orden de tabulación tiene sentido |
| Enlaces roto, `id` duplicados, `lang` | Si el mensaje de error se entiende |
| Tamaño de la página y recursos | Si la página se siente rápida |
| Errores de consola | Si el estado tras el error tiene salida |
| Tipos y lint | Si la abstracción es la correcta |

**Nunca** se declara una interfaz "técnicamente correcta" a partir de un informe
automático en verde.

---

## 8. Checklist de revisión técnica

**Semántica**

- [ ] Cada interacción usa el elemento nativo correcto.
- [ ] Landmarks presentes y únicos; un solo `h1`; sin saltos de nivel.
- [ ] Tablas con `caption` y `scope`; formularios con `fieldset`/`legend`.
- [ ] `<title>` descriptivo y único; `lang` correcto.

**Mejora progresiva**

- [ ] La tarea principal funciona sin JavaScript.
- [ ] Sin CSS, el orden de lectura sigue teniendo sentido.
- [ ] Cada efecto nuevo (`@supports`, `@container`, glass) degrada con elegancia.

**CSS**

- [ ] Orden de `@layer` declarado una vez.
- [ ] Sin `!important`, sin estilos en línea, sin anidar más de 3 niveles.
- [ ] Sin CSS muerto ni duplicado; sin dos frameworks de utilidades.
- [ ] Estilos encapsulados por componente.

**JavaScript**

- [ ] Todo listener, timer, observador y `fetch` tiene su baja.
- [ ] Sin `catch` vacíos; los errores se manejan o se propagan.
- [ ] Sin condiciones de carrera en la carga de datos.
- [ ] Listeners de `scroll`/`touch` pasivos y limitados.
- [ ] Sin reflows forzados dentro de bucles.

**Seguridad e i18n**

- [ ] Sin `innerHTML` con datos del usuario.
- [ ] `target="_blank"` con `rel="noopener noreferrer"`.
- [ ] `Intl` para todo lo formateable; sin concatenar textos.
- [ ] Propiedades lógicas; probado en RTL.

**Cierre**

- [ ] Sin listeners, timers ni observers huérfanos.
- [ ] Sin referencias a elementos eliminados.
- [ ] Consola limpia en la tarea principal.
