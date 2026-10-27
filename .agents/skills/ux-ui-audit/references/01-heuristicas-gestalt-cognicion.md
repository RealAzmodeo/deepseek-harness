# Marco de evaluación: Nielsen, Gestalt y leyes cognitivas

## Cómo se usa

Este fichero es el **vocabulario de diagnóstico**. Cada hallazgo debe nombrar la
ley o heurística concreta que se viola; sin nombre, el hallazgo es una opinión y
no se acepta en el informe.

---

## 1. Las 10 heurísticas de Nielsen — versión operativa

Publicadas por Nielsen y Molich en 1990 y fijadas en 1994; NN/g reescribió su
redacción en 2020. Son un **checklist de inspección**, no una prueba empírica.

### H1 · Visibilidad del estado del sistema

El sistema informa qué está pasando con feedback dentro de un tiempo razonable.

- **Señales de violación:** operación de más de 1s sin indicador; botón de envío
  que no cambia a estado ocupado; wizard sin indicador de paso; `<progress>` sin
  `value` en operaciones largas; cambio de estado que no se anuncia.
- **Fix:** estado de carga **por región**, nunca global; `aria-busy` en el
  contenedor; percent-done a partir de 10s.

### H2 · Coincidencia entre el sistema y el mundo real

Lenguaje del usuario, convenciones reales, orden lógico.

- **Señales:** jerga interna ("SKU", "entidad", "registro"); el orden de los
  campos contradice el flujo mental (código postal antes de la dirección);
  metáforas inventadas.
- **Fix:** glosario del dominio; etiquetas visibles y en el idioma del usuario;
  orden según la tarea, no según la base de datos.

### H3 · Control y libertad del usuario

Salidas de emergencia: cancelar, deshacer, volver.

- **Señales:** modal sin `Escape` ni botón de cierre; acciones destructivas sin
  deshacer; filtros sin "limpiar"; recarga que pierde la posición de scroll.
- **Fix:** cancelar explícito; ventana de deshacer; cierre por `Escape` y clic
  fuera.

### H4 · Consistencia y estándares

Internas y externas. Las expectativas vienen de otros productos (Ley de Jakob).

- **Señales:** dos componentes con el mismo nombre y distinto comportamiento;
  botón primario con color distinto por pantalla; `Enter` que envía en un
  formulario y no en otro; el mismo icono con dos significados.
- **Fix:** tokens y librería única; auditoría de nomenclatura; inventario de
  patrones.

### H5 · Prevención de errores

Mejor prevenir que redactar un buen mensaje de error.

- **Señales:** validación solo en `submit`; campo de texto libre donde cabría un
  `select` o una máscara; acciones irreversibles sin confirmación; borradores no
  guardados.
- **Fix:** validación en `blur`; restricciones de entrada; confirmación tipada
  para borrados masivos; autosave.

### H6 · Reconocer antes que recordar

Minimizar la memoria de trabajo.

- **Señales:** obligación de recordar un dato de un paso anterior; códigos de
  cupón tecleados a mano; comparación de productos en pantallas separadas.
- **Fix:** prerrellenar lo ya introducido (coincide con 3.3.7); comparativa en la
  misma vista; ayuda contextual en el punto de duda.

### H7 · Flexibilidad y eficiencia de uso

Aceleradores para expertos, simplicidad para novatos.

- **Señales:** sin atajos de teclado; sin filtros guardados; sin acciones en
  lote; `tabindex` forzado que rompe el orden natural.
- **Fix:** atajos documentados, acciones masivas, valores por defecto sensatos.

### H8 · Diseño estético y minimalista

La señal frente al ruido. **No** significa "menos datos".

- **Señales:** densidad decorativa (sombras, bordes, gradientes) compitiendo con
  el contenido; texto redundante; en un panel de datos, ocultar métricas clave
  "por minimalismo".
- **Fix:** jerarquía por espacio y tipografía. En UI densa la regla correcta es
  **densidad informativa alta con cromo visual bajo**, no vaciar la pantalla.

### H9 · Ayudar a reconocer, diagnosticar y recuperarse de errores

Lenguaje llano, causa y solución.

- **Señales:** "Error 422", "Operación no válida"; color rojo como único canal;
  error al pie sin vínculo con el campo ni foco; datos perdidos.
- **Fix:** mensaje junto al campo, `aria-describedby`, foco al primer error,
  datos preservados.

### H10 · Ayuda y documentación

Buscable, contextual y orientada a la tarea. El ideal es no necesitarla.

- **Señales:** ayuda en un PDF externo; sin búsqueda; sin contexto en el paso
  donde surge la duda.
- **Fix:** ayuda inline, `details` o tooltip accesible, enlace a la tarea exacta.

### Agrupación práctica (no es una taxonomía de NN/g)

| Categoría | Heurísticas | Qué se audita |
| --- | --- | --- |
| Simplicidad | H2, H8 | ¿Se entiende sin manual? ¿Está el ruido fuera? |
| Consistencia | H4, H6, H7 | ¿Se comporta igual en todas partes? |
| Feedback | H1, H3, H9, H10 | ¿El sistema responde, deja salir y explica? |

Úsala como índice mental. **No la cites como NN/g**: NN/g nunca publicó un
conjunto nuevo de heurísticas y su artículo de 1994 sigue siendo la referencia.

### Heurísticas posteriores

Lo que sí existe, y es citable: las **Guidelines for Human-AI Interaction**
(Microsoft Research, Amershi et al., CHI 2019), 18 directrices para sistemas con
IA — hacer claro qué puede hacer el sistema, soportar una corrección eficiente,
explicar por qué, recordar interacciones recientes. Aplícalas cuando el material
auditado tenga funciones generativas; no sustituyen a las 10 de Nielsen.

---

## 2. Leyes de Gestalt — el conjunto completo

| Ley | Predice | Aplicación en UI | Violación típica (CSS) |
| --- | --- | --- | --- |
| **Proximidad** | Lo cercano se agrupa | `gap` de 8/16/24px según relación; la etiqueta está más cerca de **su** campo que del siguiente | `margin: 16px` uniforme en todo: la etiqueta queda equidistante de dos campos |
| **Similitud** | Los rasgos compartidos agrupan, incluso a distancia | Un solo color de enlace; un solo botón primario | Color de marca en iconos decorativos no clicables; iconos casi idénticos para funciones distintas |
| **Región común** | Un borde o un fondo delimita un grupo | Card con fondo y radio para agrupar metadatos | Cajas anidadas con el mismo padding: no se distingue grupo de grupo |
| **Continuidad** | Se percibe una línea o un eje continuo | Alineación en columnas, sliders, steppers | Elementos desalineados 2–3px rompen el eje; `float` en lugar de grid |
| **Cierre** | Se completa la forma incompleta | Bordes parciales, tarjetas con encabezado implícito | Marcos abiertos que dejan el grupo ambiguo |
| **Figura-fondo** | Separa la capa activa del fondo | Modal con scrim, elevación, contraste de superficie | Contraste < 3:1 entre superficie y fondo (falla también 1.4.11) |
| **Destino común** | Lo que se mueve junto pertenece junto | Transiciones sincronizadas de grupo; drag con fantasma del conjunto | Un elemento con `transition` distinta dentro del mismo bloque animado |
| **Conexión uniforme** | La unión visual es el agrupador más fuerte | Steps con conector, árboles, divisores de tabla | Reglas horizontales entre filas relacionadas; un separador que parte un formulario en dos |
| **Prägnanz (buena forma)** | Se prefiere la interpretación más simple | Grid regular, iconos con silueta limpia | Formas ambiguas, radios inconsistentes, ruido con alfa |
| **Experiencia pasada** | El aprendizaje previo agrupa | Respetar las convenciones de tabla, carrito y formulario | Romper el patrón esperado sin motivo |
| **Paralelismo** | Los elementos alineados en paralelo se relacionan | Filas de tarjetas con línea base común | Grid con alturas variables y texto a distintas alturas |

**Orden de arbitraje cuando las leyes se contradicen:**

> conexión uniforme > región común > proximidad > similitud

Si un borde contradice el espacio, **el usuario cree al borde**. Un separador mal
puesto hace más daño que un `gap` mal calculado.

---

## 3. Leyes cognitivas y de psicología

| Ley | Enunciado | Número concreto (con matiz) | Violación típica |
| --- | --- | --- | --- |
| **Fitts** | El tiempo de adquisición depende de distancia y tamaño | Objetivo táctil ≥ 24×24 CSS px (AA), 44×44 recomendado | Iconos de 16px; acciones destructivas pegadas a la primaria |
| **Hick-Hyman** | El tiempo de decisión crece logarítmicamente con el número y la complejidad de opciones | — | Menús de 30 ítems; modales con 8 CTA |
| **Miller** | La memoria de trabajo maneja pocos *chunks* | **Matiz obligatorio:** Miller (1956) medía juicio absoluto, **no** capacidad de memoria; NN/g advierte que deducir "menús de 7 ítems" es un error; Cowan (2001) sitúa el límite en ~4±1 | Truncar listas a 7 por superstición; no agrupar nada |
| **Jakob** | Los usuarios pasan su tiempo en otras webs y esperan los mismos patrones | — | Checkout o navegación inventados |
| **Tesler** | La complejidad irreducible no desaparece: se mueve entre el usuario y el sistema | — | Trasladar al usuario trabajo que el sistema podría hacer |
| **Doherty** | La productividad sube cuando el sistema responde en < 400ms | 400ms | Operaciones de 2s sin indicador |
| **Peak-End** | Se juzga por el pico emocional y el final | — | Un onboarding brillante y un cierre plano |
| **Von Restorff** | Lo distinto se recuerda | — | Todos los botones del mismo color |
| **Zeigarnik** | Las tareas incompletas se recuerdan más | — | Progreso invisible en un onboarding |
| **Serial Position** | Se recuerdan el primero y el último ítem | — | Acción destructiva al final de un menú largo por descuido |
| **Parkinson** | El trabajo se expande hasta llenar el tiempo disponible | — | Formularios sin presets ni valores por defecto |
| **Aesthetic-Usability** | Lo bello se percibe como más usable | — | Confundir "se ve bien" con "es usable" en una prueba |
| **Goal-Gradient** | El esfuerzo aumenta al acercarse a la meta | — | Barra de progreso deshonesta |
| **Cognitive Load** | Carga intrínseca (contenido), extrínseca (mala UI) y germánica (aprendizaje) | — | Eliminar la intrínseca (empobrecer el contenido) en vez de la extrínseca |
| **Continuidad de la experiencia** | La consistencia entre canales fija expectativas | — | La app y la web nombran distinto la misma entidad |

**Regla de uso:** la ley cognitiva explica el **impacto**. Sin ella, el informe
dice "esto está mal"; con ella, dice "esto cuesta 400ms de decisión por fila en
una tabla de 200 filas".

---

## 4. Los umbrales de tiempo (Nielsen, 1993)

| Umbral | Qué se percibe | Qué exige el diseño |
| --- | --- | --- |
| **0,1s** | Manipulación directa | Nada. Es el objetivo. |
| **1s** | Se mantiene el flujo de pensamiento | Nada obligatorio, pero se pierde la sensación de operar sobre los datos |
| **1–10s** | La atención se mantiene | Indicador de que el sistema trabaja |
| **> 10s** | La atención se pierde | Percent-done **y** forma de interrumpir |

Entre 2 y 10 segundos el percent-done suele sobrar: basta un feedback discreto.

---

## 5. Cómo citar un hallazgo con este marco

Fórmula obligatoria:

> **Hallazgo → evidencia (archivo:línea o medición) → ley o heurística violada →
> usuario afectado → severidad → corrección concreta**

Ejemplo correcto:

> `Notificaciones.tsx:84` separa la etiqueta del campo con el mismo `gap` que usa
> entre campos (16px), así que la etiqueta queda equidistante de su campo y del
> siguiente. Viola **proximidad (Gestalt)** y **H2/H5**. Afecta a cualquier
> usuario rellenando el formulario: es el error de "escribí en el campo de
> abajo". Severidad **alta**. Fix: `gap: 4px` dentro del campo y `24px` entre
> campos, con tokens de stack.

Ejemplo incorrecto (no se acepta): "El formulario se ve desordenado y habría que
mejorarlo."
