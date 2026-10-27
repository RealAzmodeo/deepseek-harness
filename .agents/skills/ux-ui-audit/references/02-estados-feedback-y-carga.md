# Los 5 estados, feedback y resiliencia

Todo componente que **lea datos o espere una respuesta** debe implementar los
cinco estados. Un componente sin estados no está "a medias": está roto, porque
el usuario lo verá en los cinco a lo largo del día.

## Los cinco estados

### 1 · Ideal

Contenido real, denso y completo. Es el único que suele estar diseñado, y por eso
el resto parece improvisado.

**Qué se audita:** que exista con **contenido extremo**, no con el ejemplo corto
del diseñador.

### 2 · Vacío

Nunca "No hay datos" a secas, nunca una pantalla en blanco.

| Caso | Qué debe decir | Acción |
| --- | --- | --- |
| Primer uso (nunca hubo datos) | Qué es esta sección y qué aparecerá aquí | Crear / importar / invitar (la acción primaria) |
| Filtro sin resultados | "Sin resultados para «X»" | Limpiar filtros / ampliar rango |
| Todo borrado | Confirmación del estado | Deshacer o crear de nuevo |
| Sin permisos | Por qué no se ve y quién puede darlo | Solicitar acceso |
| Error de carga ≠ vacío | Es un estado de error | Reintentar |

**Anti-patrón `G-02`:** el vacío sin acción. Deja al usuario sin salida y es la
primera causa de abandono en un producto nuevo.

### 3 · Carga

| Situación | Patrón correcto |
| --- | --- |
| Estructura predecible | **Skeleton** con la forma del contenido final y **espacio reservado** (evita CLS) |
| Estructura impredecible | Spinner **local**, con texto de estado |
| Lista homogénea | Carga progresiva: el usuario consume lo primero mientras llega el resto |
| Navegación | Barra de progreso superior, no overlay de pantalla completa |
| Nunca | Modal de carga bloqueando lo que el usuario ya podría leer |

**Anti-patrones:** `G-03` spinner de página completa; `G-04` skeleton sin
reservar espacio; `G-14` skeleton eterno cuando la petición falla.

### 4 · Error

Recuperable por definición. Debe responder a cuatro preguntas:

1. **Qué** falló.
2. **Dónde** (qué campo, qué elemento).
3. **Por qué** (causa probable).
4. **Cómo** se arregla (acción concreta).

Y una regla inquebrantable: **los datos introducidos por el usuario no se
pierden nunca** (`F-03`, nivel 1 del protocolo de rechazo).

### 5 · Edge cases

| Caso | Prueba | Fix |
| --- | --- | --- |
| Texto larguísimo sin espacios | Pegar una URL de 200 caracteres | `overflow-wrap: anywhere` + `min-width: 0` |
| 0 / 1 / muchos ítems | Forzar los tres | Estados distintos, no el mismo |
| Valores máximos | 999999999, 100% | Separador de miles, truncado con acceso al valor |
| Valores vacíos | `null`, `undefined`, `NaN` | Guion "—", nunca "NaN" ni "Invalid Date" |
| i18n | Textos 40% más largos | Sin anchos fijos; `:lang()` sin asumir longitud |
| RTL | `dir="rtl"` | Propiedades lógicas (`margin-inline-start`) |
| Fechas límite | 29 feb, cambio de mes, zona horaria | `Intl.DateTimeFormat` |
| Datos corruptos o parciales | Campo ausente | Degradar, no romper la vista |

---

## Feedback: qué responder y cuándo

| Tiempo | Qué hacer |
| --- | --- |
| < 100ms | Feedback inmediato de la pulsación (`:active`). Sin él, el usuario vuelve a pulsar |
| < 1s | Nada especial |
| 1–10s | Indicador de actividad en el elemento o la región |
| > 10s | Progreso con porcentaje **y** forma de cancelar |

### Confirmación de acciones

| Tipo de acción | Confirmación correcta |
| --- | --- |
| Reversible y frecuente | Optimista + deshacer (toast con "Deshacer", ≥ 5s) |
| Reversible pero costosa | Spinner en el botón + confirmación al terminar |
| Irreversible y destructiva | Diálogo con verbo concreto ("Eliminar 3 elementos"), foco en la opción **segura**, y alternativa |
| Con efecto externo (pago, envío, email) | **Nunca optimista**: esperar la respuesta del servidor |

### Optimistic UI: cuándo sí y cuándo no

**Segura:** acciones idempotentes, reversibles y de bajo riesgo (marcar como
leído, un "me gusta", reordenar una lista local).

**Peligrosa:** pagos, envíos, reservas, cualquier operación con efecto externo o
no idempotente. Si se usa, exige rollback visible, estado de reconciliación y
bloqueo de reintentos. **Si no puedes revertir con claridad, no la uses.**

### Microcopy de errores

**Sí:** "No pudimos guardar los cambios. Comprueba tu conexión y vuelve a
intentarlo." — voz activa, sin culpar, con salida.

**No:**

- "Error inesperado" / "Operación no válida" / "Error 422".
- "Has introducido mal el correo" (culpa al usuario).
- "Simplemente haz…" (condescendiente).
- MAYÚSCULAS GRITADAS o signos de exclamación múltiples.
- Códigos internos, trazas o nombres de tabla.
- Un mensaje que borra lo que el usuario escribió.

---

## Checklist rápida de estados

- [ ] El estado ideal está probado con datos extremos, no con el ejemplo corto.
- [ ] Existen vacío de primer uso, vacío por filtro y vacío por permisos.
- [ ] El skeleton reserva exactamente el espacio del contenido final.
- [ ] Existe estado de error **de red**, distinto del error de validación.
- [ ] Todo error tiene acción de recuperación visible.
- [ ] Los datos introducidos sobreviven a cualquier fallo.
- [ ] Los cinco estados se anuncian a tecnologías de apoyo (`role="status"`,
      `role="alert"`, `aria-busy`).
- [ ] Ningún estado dura indefinidamente sin explicación.
