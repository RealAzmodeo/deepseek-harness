# Átomos, moléculas, componentes y el único lugar donde viven

## 1. El modelo atómico, sin dogma

Definiciones operativas (Brad Frost, *Atomic Design*, cap. 2):

| Nivel | Definición |
| --- | --- |
| **Átomos** | Elementos que no se pueden descomponer más sin dejar de ser funcionales |
| **Moléculas** | Grupos relativamente simples de elementos que funcionan juntos como una unidad |
| **Organismos** | Componentes relativamente complejos, compuestos de moléculas y/o átomos |
| **Plantillas** | Objetos de nivel de página que colocan componentes en un layout y articulan la estructura de contenido |
| **Páginas** | Instancias concretas de plantillas con contenido real |

### La letra pequeña que casi nadie cita

El propio Frost relativiza el modelo en el mismo libro: *"Atomic design is **not a
linear process**, but rather a mental model"*; *"is **not rigid dogma**"*; *"has
**nothing to do with web-specific subjects like CSS or JavaScript architecture"*.

La crítica vigente (2025–2026) es de **taxonomía**, no de concepto: los equipos se
atascan discutiendo si una tarjeta con avatar y etiqueta es molécula u organismo,
y esa conversación es un impuesto. El consenso práctico:

> **La abstracción que merece conservarse es la composición.** Si un componente
> intermedio es "molécula" u "organismo" es un problema de nomenclatura, no de
> diseño.

**Regla para el auditor:** el nivel **no** es un atributo verificable. Se decide
por (a) si el componente tiene identidad de producto propia y (b) si su
composición interna se reutiliza. **No se abren hallazgos por desacuerdos de
nomenclatura**, y se aceptan taxonomías alternativas (`primitives/` +
`composites/`, o simplemente `ui/`).

### La frontera que sí importa: token o componente

| Es… | Cuándo |
| --- | --- |
| **Token** | Su valor es puramente visual: color, radio, sombra, duración, espaciado |
| **Componente** | Tiene comportamiento, estado y contrato de accesibilidad: button, input, icon, dialog |

Un "átomo" que solo aporta valor visual **es un token** y no debe existir como
componente. Es la causa número uno de sistemas inflados.

---

## 2. La arquitectura completa: cuatro capas, un solo lugar

```
┌─────────────────────────────────────────────────────────────────────┐
│  FUENTE ÚNICA DE VERDAD                                             │
│  tokens/*.tokens.json   (DTCG 2025.10)                              │
│  ┌───────────────┬────────────────────┬──────────────────────────┐  │
│  │ 1 primitivos  │ 2 semánticos       │ 3 componente             │  │
│  │ --prim-*      │ --color-*, --space-*│ --button-*, --card-*    │  │
│  └───────────────┴────────────────────┴──────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  Style Dictionary / Terrazzo
                               ▼
                    tokens.css  ·  tokens.kt  ·  tokens.swift
                               │
                               │  importado UNA vez, en el entrypoint
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA DE COMPONENTES  (registry único, exportado por un barrel)     │
│                                                                     │
│  ÁTOMOS        Button  Input  Icon  Checkbox  Badge  Spinner        │
│  MOLÉCULAS     Field(label+input+error)  SearchBar  Card+actions    │
│                FormActions  Pagination  Toast  EmptyState           │
│  ORGANISMOS    DataTable  Modal  NavBar  Form  Sidebar  Wizard      │
│  PLANTILLAS    AppShell  ListDetail  SettingsLayout                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  import { Button } from '@/ui'
                               ▼
                        Consumo en producto
```

**El "único lugar" son dos y solo dos:**

1. **Un fichero de tokens** (la fuente DTCG) del que se generan todos los
   artefactos. Nadie declara un valor visual fuera de él.
2. **Un punto de entrada de componentes** (el *barrel* `ui/index.ts`) por el que
   se importa todo. Nadie importa desde una ruta interna.

Cuando un componente necesita un valor que no existe, **se añade al sistema**;
no se escribe en el componente.

---

## 3. Cómo se construye cada nivel

### Átomos

**Qué son:** un solo elemento, un solo trabajo, estados completos.

```css
/* El átomo no conoce el dominio y no declara literales. */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--button-gap);
  min-height: var(--button-height); /* ≥ 44px */
  padding-inline: var(--button-padding-inline);
  border-radius: var(--button-radius);
  background: var(--button-bg);
  color: var(--button-fg);
  font: var(--button-font);
  transition: var(--button-transition);
}
.btn:hover:not(:disabled) { background: var(--button-bg-hover); }
.btn:active:not(:disabled) { background: var(--button-bg-active); }
.btn:focus-visible { outline: var(--focus-ring-width) solid var(--focus-ring-color); outline-offset: var(--focus-ring-offset); }
.btn:disabled { background: var(--button-bg-disabled); color: var(--button-fg-disabled); cursor: not-allowed; }
```

**Reglas del átomo:**

- API cerrada: `variant` / `size` / `tone`. Nunca booleanos acumulables.
- Consume solo capa 2 y capa 3 de tokens.
- Reenvía `ref` y las props al elemento del DOM.
- No conoce el dominio: `Button`, no `SaveUserButton`.
- Nunca una prop `color` arbitraria.

### Moléculas

**Qué son:** átomos coordinados que resuelven **una** micro-tarea (un campo con
su etiqueta y su error; una barra de búsqueda).

**Reglas:**

- La molécula posee la **composición**, no el estilo de sus átomos.
- Mantiene el estado local mínimo (qué campo está inválido).
- Expone `children` o *slots* en vez de props de render.
- **Aquí vive el conocimiento del dominio ligero**: `SearchBar` sabe que hay un
  botón de limpiar y un icono; no sabe qué se busca.

Ejemplo: una molécula `Field` no debe existir sin sus tres estados de ayuda —
pista, error y estado de carga. Si el sistema tiene `Input` pero no `Field`, cada
formulario reinventará la asociación `label`/`aria-describedby` y la mitad lo
hará mal.

### Organismos

**Qué son:** secciones discretas de interfaz (`DataTable`, `Modal`, `Form`,
`NavBar`) compuestas de moléculas y átomos.

**Reglas:**

- Un organismo puede tener lógica (ordenación, paginación, foco atrapado).
- **Debe** cubrir los 5 estados cuando lee datos (ver
  [02-estados-feedback-y-carga.md](02-estados-feedback-y-carga.md)).
- No contiene lógica de negocio de la aplicación: recibe datos y callbacks.
- Usa **container queries** para adaptarse, no media queries.

### Plantillas y páginas

Reservadas al layout. **No son componentes del sistema** en el sentido estricto:
son composiciones de producto. Muchos sistemas maduros las abandonan
explícitamente, y eso no es un defecto.

---

## 4. La API de un componente

| Decisión | Correcto | Anti-patrón |
| --- | --- | --- |
| Variantes | `variant="primary" \| "secondary" \| "ghost"` (unión cerrada) | `isPrimary isSecondary isGhost` |
| Tamaño | `size="sm" \| "md" \| "lg"` | `isSmall isLarge` |
| Tono | `tone="danger" \| "success"` | `color="#dc2626"` |
| Contenido | `children` y slots | Props de render (`renderIcon`, `labelNode`) |
| Comportamiento | *headless*: la lógica y la accesibilidad separadas del estilo | Reimplementar el comportamiento nativo |
| Adaptación | Container queries | Media queries del viewport |
| Estilos | Tokens, encapsulados | Estilos que se filtran al exterior |
| Reenvío | `ref` y props al DOM | Componente opaco que rompe el foco y el `id` |

### Reglas duras

1. **Composición antes que configuración.** Si un componente supera las ~8 props,
   probablemente quiere ser composición.
2. **El estado tiene una sola fuente.** No duplicar en prop y en estado interno.
3. **Todos los estados existen:** default, hover, active, focus-visible,
   disabled, loading, error, empty.
4. **Nunca reimplementar un primitivo nativo peor.** `<select>`, `<input
   type="checkbox">` y `<dialog>` dan accesibilidad gratis; reemplazarlos exige
   reproducir teclado, roles y estados.
5. **Nada de dominio en los átomos.** `UserAvatarWithBadge` no es un átomo.

### Ficha mínima de componente

```md
### Field
Propósito: agrupa etiqueta, control, ayuda y error de un único campo.
No usar cuando: el control no necesita etiqueta visible (usa el átomo directo).

Props:  label, hint, error, required, id, children
Estados: default · focus · invalid · disabled · readonly
Tokens: --field-*, --space-inline-xs, --field-error-fg
A11y:   <label for>, aria-describedby → hint/error, aria-invalid, role="alert" en el error
Límites: texto de etiqueta a 60 caracteres; error a 140.
Ejemplos: campo corto · etiqueta larga · error + pista simultáneos · RTL
```

---

## 5. Cómo se unifica todo en un solo lugar

### El barrel

```ts
// ui/index.ts — el único punto de import
export { Button } from './atoms/Button'
export { Icon } from './atoms/Icon'
export { Field } from './molecules/Field'
export { SearchBar } from './molecules/SearchBar'
export { DataTable } from './organisms/DataTable'
export { Modal } from './organisms/Modal'
```

```ts
// En producto: nunca se importa una ruta interna.
import { Button, Field } from '@/ui'
```

Un import desde `@/ui/atoms/Button/Button.styles.css` es un hallazgo: significa
que el sistema no tiene una puerta única y que un cambio interno romperá
consumidores.

### El token único

```css
/* tokens.css — generado, importado UNA vez en el entrypoint. */
@layer tokens.primitive, tokens.semantic, tokens.component, tokens.theme;
```

Ninguna aplicación redefine tokens. Una app **puede** reasignar valores de la
capa semántica en su scope (marca, densidad), pero nunca declarar capa 1.

### El registro

| Artefacto | Dónde vive | Quién lo consume |
| --- | --- | --- |
| Fuente de tokens | `tokens/*.tokens.json` | El compilador |
| Tokens generados | `tokens.css`, `tokens.kt`, `tokens.swift` | Toda la plataforma |
| Componentes | `ui/` con un `index.ts` | Todo el producto |
| Fichas | Junto al componente o en el catálogo | Diseño y desarrollo |

**Prueba de que el sistema está unificado:** si mañana cambia el color de marca,
debería bastar con **un** cambio en la capa semántica. Si hay que tocar más de un
sitio, el sistema no existe: hay copias.

---

## 6. Anti-patrones de componentes y composición

| ID | Anti-patrón | Detección | Daño |
| --- | --- | --- | --- |
| K-01 | Props booleanas explosivas | `isPrimary && isDanger && isGhost` | Estados imposibles e inconsistentes |
| K-02 | El componente acepta `color` arbitrario | `color?: string` con hex | El sistema pierde el control del contraste |
| K-03 | Variantes adivinadas por CSS (`:has`, posición) | Inspección | Frágil y opaco |
| K-04 | Componente sin estados internos | Sin loading/error/empty | Cada consumidor los reimplementa distinto |
| K-05 | Estado derivado duplicado | Prop y estado interno con el mismo dato | Divergen |
| K-06 | Composición por configuración | Props de render | El componente crece sin límite |
| K-07 | Componente gigante que hace de página | Tamaño del archivo | Imposible de testear y reutilizar |
| K-08 | Estilos que se filtran fuera | Inspección | Rompe consumidores |
| K-09 | Reimplementar un primitivo nativo peor | `<div role="listbox">` casero | Se pierde la accesibilidad gratis |
| K-10 | Sin reenvío de `ref`/props | Inspección | Rompe foco, `id` y medición |
| K-11 | Átomos que conocen el dominio | `<UserCard>` en `atoms/` | No reutilizable |
| K-12 | Acoplamiento oculto entre hermanos | Contexto implícito | Comportamiento sorprendente |
| K-13 | Import desde rutas internas | Grep de `ui/atoms/` en producto | La puerta única no existe |
| K-14 | Componente sin ficha | Inspección | Se reimplementa a los tres meses |
| K-15 | Duplicar un componente del sistema en producto | Buscar bloques casi idénticos | Deriva visual y doble mantenimiento |

---

## 7. Checklist de arquitectura

- [ ] Existe una fuente de tokens única y versionada.
- [ ] Los tokens generados no se editan a mano.
- [ ] Existe un único punto de importación de componentes.
- [ ] Cero imports desde rutas internas del sistema.
- [ ] Cada componente tiene ficha con propósito, estados, tokens y a11y.
- [ ] Los átomos no conocen el dominio.
- [ ] Las variantes son uniones cerradas, no booleanos acumulables.
- [ ] Los componentes con datos cubren los 5 estados.
- [ ] Los componentes usan container queries.
- [ ] No hay un componente que solo aporte valor visual (eso es un token).
- [ ] Un cambio de marca se resuelve en la capa semántica, en un solo sitio.
- [ ] No se abren hallazgos por desacuerdos de nomenclatura atómica.
