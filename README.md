# PSO — Simulador de procesos y memoria

Actividad de Evaluación 2 intercátedra de Paradigmas y Lenguajes de
Programación II y Sistemas Operativos.

Biblioteca de clases desarrollada en TypeScript que simula procesos
compartiendo una memoria limitada y una única CPU. No contiene interfaz
gráfica, menú de consola ni programa principal. Su funcionamiento se
verifica mediante pruebas automatizadas.

## Requisitos

- Node.js 24.
- npm, incluido con Node.js.
- Git para clonar el repositorio.

## Instalación

```bash
git clone https://github.com/Bel334/PSO.git
cd PSO
npm ci
```

`npm ci` instala las versiones registradas en `package-lock.json`.

## Verificación

Revisar los tipos de TypeScript:

```bash
npm run typecheck
```

Ejecutar los tests:

```bash
npm test
```

Ejecutar los tests y generar el reporte de cobertura:

```bash
npm run coverage
```

El reporte se muestra en la terminal y se genera en `coverage/`.
Para consultarlo visualmente, abrir `coverage/index.html` en un navegador.

La cobertura incluye los archivos TypeScript de `src/`, incluso los no
importados por los tests. Las interfaces no contienen instrucciones
ejecutables.

La configuración exige una cobertura global de líneas de al menos 91%,
para superar el 90% solicitado por la consigna.

## Funcionalidad

- Memoria total y quantum configurables como enteros positivos.
- Procesos con PID único, memoria requerida y CPU total.
- Estados: Nuevo, Esperando Memoria, Listo, Ejecutando, Bloqueado y Terminado.
- Asignación contigua de memoria mediante First-Fit.
- División de bloques, liberación y coalescencia de vecinos libres.
- Planificación Round-Robin con cola FIFO de Listos.
- Avance mediante ticks discretos, sin temporizadores ni esperas reales.
- Eventos deterministas de E/S.
- Consultas del sistema mediante copias de sus datos.
- Métricas de CPU, memoria y fragmentación externa.

## Orden de cada tick

Cada llamada a `avanzarTick()` realiza:

1. Intento de admisión y asignación de memoria, en orden de registro.
2. Actualización de procesos bloqueados.
3. Despacho y ejecución Round-Robin, con liberación de memoria al finalizar.
4. Incremento del reloj y actualización de métricas.

Como máximo un proceso consume una unidad de CPU por tick.

La memoria liberada durante la ejecución se ofrece en la fase de admisión
del tick siguiente. Un proceso cuyo bloqueo vence puede ser despachado
en ese mismo tick.

## Decisiones de implementación

### Memoria

Se implementa una única política: First-Fit. El gestor conserva los bloques
ordenados por dirección y selecciona el primero libre donde cabe el proceso.

La coalescencia fusiona bloques libres adyacentes. No desplaza bloques
ocupados ni realiza compactación.

### CPU

Al finalizar un proceso, no se ejecuta otro hasta el tick siguiente.

Si vence el quantum y hay otros Listos, el proceso vuelve al final de la
cola. Si está solo, renueva su quantum sin abandonar la CPU.

Las prioridades son: finalización, bloqueo de E/S y vencimiento del quantum.

### Entrada y salida

Se permite configurar un evento de E/S por proceso antes de su admisión.

El evento indica después de cuántos ticks de CPU consumidos se dispara
y cuántos ticks dura el bloqueo. Ambos valores deben ser enteros positivos;
el umbral no puede superar la CPU total.

Si el evento coincide con la finalización, el proceso termina sin bloquearse.

El proceso bloqueado conserva su memoria. La duración del bloqueo comienza
a descontarse en los ticks posteriores al que produjo el bloqueo.

### Cambios de contexto

Se cuenta un cambio de contexto por:

- Expulsión debida al quantum cuando hay otros procesos Listos.
- Bloqueo por E/S.

No se cuenta despacho inicial, finalización ni renovación de quantum
cuando no hay otros Listos.

## Métricas

- Ocupación de memoria:
  `100 × memoria ocupada / memoria total`.
- Utilización de CPU:
  `100 × ticks ocupados / ticks transcurridos`; en tick 0 es 0%.
- Cambios de contexto acumulados según la convención anterior.
- Memoria libre total.
- Mayor bloque libre.
- Fragmentación externa:
  `100 × (1 − mayor bloque libre / memoria libre total)`.
  Si no hay memoria libre, es 0%.

## Organización

```text
src/                    Clases, interfaces y tipos del simulador
test/                   Pruebas automatizadas
.github/workflows/      Verificación automática en GitHub Actions
vitest.config.mts       Configuración de tests y cobertura
```

## Responsabilidades

| Componente | Responsabilidad |
|---|---|
| Proceso | Proteger estados, transiciones y contadores de CPU y bloqueo. |
| BloqueMemoria | Representar dirección, tamaño y ocupante de un bloque. |
| FirstFit | Seleccionar el primer bloque libre suficiente. |
| GestorMemoria | Asignar, dividir, liberar y fusionar bloques. |
| PlanificadorRoundRobin | Administrar la cola de Listos y el proceso en CPU. |
| Metricas | Acumular contadores y calcular indicadores. |
| Simulador | Registrar procesos y coordinar las fases de cada tick. |

Se utilizan interfaces, atributos privados, composición y consultas
mediante copias. No se utiliza herencia de clases ni clases abstractas
porque no se identificó una relación que las justifique.

## Relación entre requerimientos y pruebas

| RF | Implementación principal | Archivo de pruebas |
|---|---|---|
| RF01 | Simulador, GestorMemoria y PlanificadorRoundRobin | Simulador.test.ts |
| RF02 | Proceso y Simulador | Proceso.test.ts y Simulador.test.ts |
| RF03 | Proceso y admisión del Simulador | Proceso.test.ts y Simulador.test.ts |
| RF04 | FirstFit, BloqueMemoria y GestorMemoria | BloqueMemoria.test.ts y GestorMemoria.test.ts |
| RF05 | GestorMemoria | GestorMemoria.test.ts y Simulador.test.ts |
| RF06 | Simulador.avanzarTick | Simulador.test.ts |
| RF07 | PlanificadorRoundRobin y Proceso | PlanificadorRoundRobin.test.ts y Proceso.test.ts |
| RF08 | Proceso, PlanificadorRoundRobin y Simulador | Proceso.test.ts, PlanificadorRoundRobin.test.ts y Simulador.test.ts |
| RF09 | Metricas y Simulador | Metricas.test.ts y Simulador.test.ts |
| RF10 | Consultas del Simulador y sus componentes | Simulador.test.ts, GestorMemoria.test.ts y PlanificadorRoundRobin.test.ts |

## Casos destacados

- Round-Robin con Q=2, P1 con CPU=3 y P2 con CPU=2:
  secuencia `P1, P1, P2, P2, P1`, con un cambio de contexto.
- Huecos libres de 100 y 300 KB:
  400 KB libres, mayor hueco de 300 KB y fragmentación externa del 25%.
- Liberación al finalizar y admisión del proceso en espera en el tick siguiente.
- Bloqueo con conservación de memoria y retorno a Listos.
- Verificación de continuidad de memoria y ausencia de procesos duplicados.

## Integración continua

GitHub Actions instala dependencias con `npm ci`, revisa los tipos y ejecuta
los tests con cobertura en cada push y pull request. También permite
ejecución manual.

Resultados: https://github.com/Bel334/PSO/actions

## Resultados registrados

En la verificación del 21 de octubre de 2026:

- 126 tests aprobados en 6 archivos.
- Cobertura global de líneas: 100%.
- Cobertura global de ramas: 98,69%.

La ejecución de GitHub Actions verificada el 22 de octubre de 2026
también aprobó los 126 tests y los pasos de tipos y cobertura.

Estos valores describen esas verificaciones. Para comprobar la versión
actual, ejecutar nuevamente los comandos indicados.