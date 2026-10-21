import { expect, test } from "vitest";
import { Proceso } from "../src/Proceso.js";
import { EstadoProceso } from "../src/EstadoProceso.js";
test("el proceso guarda el PID recibido", () => {
    const proceso = new Proceso(1, 100, 3);

    expect(proceso.obtenerPid()).toBe(1);
});

test("el proceso guarda la memoria requerida", () => {
    const proceso = new Proceso(1, 100, 3);

    expect(proceso.obtenerMemoriaRequerida()).toBe(100);
});

test("rechaza un PID igual a cero", () => {
    expect(() => new Proceso(0, 100, 3)).toThrow(
        "El PID tiene que ser un entero positivo"
    );
});

test("rechaza un PID negativo", () => {
    expect(() => new Proceso(-1, 100, 3)).toThrow(
        "El PID tiene que ser un entero positivo"
    );
});

test("rechaza un PID decimal", () => {
    expect(() => new Proceso(1.5, 100, 3)).toThrow(
        "El PID tiene que ser un entero positivo"
    );
});

test("rechaza memoria igual a cero", () => {
    expect(() => new Proceso(1, 0, 3)).toThrow(
        "La memoria tiene que ser un entero positivo"
    );
});

test("rechaza memoria negativa", () => {
    expect(() => new Proceso(1, -100, 3)).toThrow(
        "La memoria tiene que ser un entero positivo"
    );
});

test("rechaza memoria decimal", () => {
    expect(() => new Proceso(1, 1.5, 3)).toThrow(
        "La memoria tiene que ser un entero positivo"
    );
});

test("el proceso guarda la CPU total", () => {
    const proceso = new Proceso(1, 100, 3);

    expect(proceso.obtenerCpuTotal()).toBe(3);
});

test("la CPU restante comienza igual a la CPU total", () => {
    const proceso = new Proceso(1, 100, 3);

    expect(proceso.obtenerCpuRestante()).toBe(3);
});
test("rechaza CPU igual a cero", () => {
    expect(() => new Proceso(1, 100, 0)).toThrow(
        "La CPU tiene que ser un entero positivo"
    );
});

test("rechaza CPU negativa", () => {
    expect(() => new Proceso(1, 100, -1)).toThrow(
        "La CPU tiene que ser un entero positivo"
    );
});

test("rechaza CPU decimal", () => {
    expect(() => new Proceso(1, 100, 1.5)).toThrow(
        "La CPU tiene que ser un entero positivo"
    );
});

test("el proceso comienza en estado Nuevo", () => {
    const proceso = new Proceso(1, 100, 3);

    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Nuevo);
});
test("un proceso Nuevo puede pasar a Esperando Memoria", () => {
    const proceso = new Proceso(1, 100, 3);

    proceso.esperarMemoria();

    expect(proceso.obtenerEstado()).toBe(
        EstadoProceso.EsperandoMemoria
    );
});

test("rechaza esperar memoria si ya esta esperando", () => {
    const proceso = new Proceso(1, 100, 3);
    proceso.esperarMemoria();

    expect(() => proceso.esperarMemoria()).toThrow(
        "El cambio de estado no esta permitido"
    );

    expect(proceso.obtenerEstado()).toBe(
        EstadoProceso.EsperandoMemoria
    );
});
test("un proceso Nuevo puede ser admitido", () => {
    const proceso = new Proceso(1, 100, 3);

    proceso.admitir();

    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Listo);
});

test("un proceso en espera de memoria puede ser admitido", () => {
    const proceso = new Proceso(1, 100, 3);
    proceso.esperarMemoria();

    proceso.admitir();

    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Listo);
});

test("un proceso Listo no puede ser admitido otra vez", () => {
    const proceso = new Proceso(1, 100, 3);
    proceso.admitir();

    expect(() => proceso.admitir()).toThrow(
        "El cambio de estado no esta permitido"
    );

    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Listo);
});
test("un proceso Listo puede pasar a Ejecutando", () => {
    const proceso = new Proceso(1, 100, 3);
    proceso.admitir();

    proceso.despachar();

    expect(proceso.obtenerEstado()).toBe(
        EstadoProceso.Ejecutando
    );
    expect(proceso.obtenerCpuRestante()).toBe(3);
});

test("un proceso Nuevo no puede ser despachado", () => {
    const proceso = new Proceso(1, 100, 3);

    expect(() => proceso.despachar()).toThrow(
        "El cambio de estado no esta permitido"
    );

    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Nuevo);
});

test("un proceso esperando memoria no puede ser despachado", () => {
    const proceso = new Proceso(1, 100, 3);
    proceso.esperarMemoria();

    expect(() => proceso.despachar()).toThrow(
        "El cambio de estado no esta permitido"
    );

    expect(proceso.obtenerEstado()).toBe(
        EstadoProceso.EsperandoMemoria
    );
});
test("el quantum consumido comienza en cero", () => {
    const proceso = new Proceso(1, 100, 3);

    expect(proceso.obtenerQuantumConsumido()).toBe(0);
});

test("ejecutar un tick consume CPU y quantum", () => {
    const proceso = new Proceso(1, 100, 3);
    proceso.admitir();
    proceso.despachar();

    proceso.ejecutarTick();

    expect(proceso.obtenerCpuRestante()).toBe(2);
    expect(proceso.obtenerCpuTotal()).toBe(3);
    expect(proceso.obtenerQuantumConsumido()).toBe(1);
    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Ejecutando);
});

test("termina al consumir toda su CPU", () => {
    const proceso = new Proceso(1, 100, 1);
    proceso.admitir();
    proceso.despachar();

    proceso.ejecutarTick();

    expect(proceso.obtenerCpuRestante()).toBe(0);
    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Terminado);
});

test("un proceso Nuevo no puede consumir CPU", () => {
    const proceso = new Proceso(1, 100, 3);

    expect(() => proceso.ejecutarTick()).toThrow(
        "El cambio de estado no esta permitido"
    );

    expect(proceso.obtenerCpuRestante()).toBe(3);
    expect(proceso.obtenerQuantumConsumido()).toBe(0);
});

test("un proceso Terminado no puede seguir consumiendo CPU", () => {
    const proceso = new Proceso(1, 100, 1);
    proceso.admitir();
    proceso.despachar();
    proceso.ejecutarTick();

    expect(() => proceso.ejecutarTick()).toThrow(
        "El cambio de estado no esta permitido"
    );

    expect(proceso.obtenerCpuRestante()).toBe(0);
    expect(proceso.obtenerQuantumConsumido()).toBe(1);
});
test("un proceso Ejecutando puede volver a Listo", () => {
    const proceso = new Proceso(1, 100, 3);
    proceso.admitir();
    proceso.despachar();
    proceso.ejecutarTick();

    proceso.reencolar();

    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Listo);
    expect(proceso.obtenerCpuRestante()).toBe(2);
});

test("el nuevo despacho reinicia el quantum consumido", () => {
    const proceso = new Proceso(1, 100, 3);
    proceso.admitir();
    proceso.despachar();
    proceso.ejecutarTick();
    proceso.reencolar();

    proceso.despachar();

    expect(proceso.obtenerQuantumConsumido()).toBe(0);
    expect(proceso.obtenerCpuRestante()).toBe(2);
});

test("un proceso Terminado no puede volver a Listo", () => {
    const proceso = new Proceso(1, 100, 1);
    proceso.admitir();
    proceso.despachar();
    proceso.ejecutarTick();

    expect(() => proceso.reencolar()).toThrow(
        "El cambio de estado no esta permitido"
    );

    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Terminado);
});
test("la E/S bloquea despues de consumir la CPU indicada", () => {
    const proceso = new Proceso(1, 100, 3);
    proceso.configurarES(1, 2);
    proceso.admitir();
    proceso.despachar();

    proceso.ejecutarTick();

    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Bloqueado);
    expect(proceso.obtenerBloqueoRestante()).toBe(2);
    expect(proceso.obtenerCpuRestante()).toBe(2);

    expect(() => proceso.ejecutarTick()).toThrow();
    expect(proceso.obtenerCpuRestante()).toBe(2);
});

test("el bloqueo vence y la E/S no vuelve a dispararse", () => {
    const proceso = new Proceso(1, 100, 3);
    proceso.configurarES(1, 2);
    proceso.admitir();
    proceso.despachar();
    proceso.ejecutarTick();

    proceso.actualizarBloqueo();

    expect(proceso.obtenerBloqueoRestante()).toBe(1);
    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Bloqueado);

    proceso.actualizarBloqueo();

    expect(proceso.obtenerBloqueoRestante()).toBe(0);
    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Listo);
    expect(proceso.obtenerCpuRestante()).toBe(2);

    proceso.despachar();
    proceso.ejecutarTick();

    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Ejecutando);
    expect(proceso.obtenerCpuRestante()).toBe(1);
});

test("la finalizacion tiene prioridad sobre la E/S", () => {
    const proceso = new Proceso(1, 100, 1);
    proceso.configurarES(1, 2);
    proceso.admitir();
    proceso.despachar();

    proceso.ejecutarTick();

    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Terminado);
    expect(proceso.obtenerBloqueoRestante()).toBe(0);
});

test.each([
    [0, 2],
    [-1, 2],
    [1.5, 2],
    [4, 2],
    [1, 0],
    [1, -1],
    [1, 1.5]
])("rechaza evento E/S invalido (%s, %s)", (umbral, duracion) => {
    const proceso = new Proceso(1, 100, 3);

    expect(() => proceso.configurarES(umbral, duracion)).toThrow(
        "El evento de E/S es invalido"
    );
    expect(proceso.obtenerEstado()).toBe(EstadoProceso.Nuevo);
});

test("rechaza configurar E/S despues de admitir", () => {
    const proceso = new Proceso(1, 100, 3);
    proceso.admitir();

    expect(() => proceso.configurarES(1, 2)).toThrow(
        "El evento de E/S es invalido"
    );
});

test("rechaza reemplazar un evento ya configurado", () => {
    const proceso = new Proceso(1, 100, 3);
    proceso.configurarES(1, 2);

    expect(() => proceso.configurarES(2, 1)).toThrow(
        "El evento de E/S es invalido"
    );
});

test("rechaza actualizar bloqueo de un proceso no bloqueado", () => {
    const proceso = new Proceso(1, 100, 3);

    expect(() => proceso.actualizarBloqueo()).toThrow();
    expect(proceso.obtenerBloqueoRestante()).toBe(0);
});