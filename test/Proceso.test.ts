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