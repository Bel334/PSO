import { expect, test } from "vitest";
import { Simulador } from "../src/Simulador.js";
import { EstadoProceso } from "../src/EstadoProceso.js";

test("inicia en tick cero con memoria libre y colas vacias", () => {
    const simulador = new Simulador(100, 2);

    expect(simulador.consultarEstado()).toEqual({
        tick: 0,
        pidEnCpu: null,
        listos: [],
        esperandoMemoria: [],
        bloqueados: [],
        terminados: [],
        procesos: [],
        memoria: [{ inicio: 0, tamano: 100, pid: null }]
    });
});

test.each([
    [0, 2],
    [-1, 2],
    [1.5, 2],
    [100, 0],
    [100, -1],
    [100, 1.5]
])("rechaza configuracion invalida (%s, %s)", (memoria, quantum) => {
    expect(() => new Simulador(memoria, quantum)).toThrow();
});

test("rechaza PID duplicado y memoria superior al total", () => {
    const simulador = new Simulador(100, 2);
    simulador.registrarProceso(1, 50, 3);

    expect(() => simulador.registrarProceso(1, 20, 1)).toThrow(
        "El PID ya esta registrado"
    );
    expect(() => simulador.registrarProceso(2, 101, 1)).toThrow(
        "El proceso supera la memoria total"
    );
    expect(simulador.consultarEstado().procesos).toHaveLength(1);
});

test("cada llamada avanza un tick incluso con CPU ociosa", () => {
    const simulador = new Simulador(100, 2);

    expect(simulador.avanzarTick().pidEjecutado).toBeNull();
    expect(simulador.consultarEstado().tick).toBe(1);
});

test("integra la secuencia minima de Round-Robin", () => {
    const simulador = new Simulador(200, 2);
    simulador.registrarProceso(1, 100, 3);
    simulador.registrarProceso(2, 100, 2);

    const resultados = Array.from(
        { length: 5 },
        () => simulador.avanzarTick()
    );

    expect(resultados.map(resultado => resultado.pidEjecutado))
        .toEqual([1, 1, 2, 2, 1]);

    expect(simulador.consultarEstado().memoria).toEqual([
        { inicio: 0, tamano: 200, pid: null }
    ]);
    expect(simulador.consultarEstado().terminados).toEqual([1, 2]);
});

test("la memoria liberada permite admitir en el tick siguiente", () => {
    const simulador = new Simulador(100, 2);
    simulador.registrarProceso(1, 100, 1);
    simulador.registrarProceso(2, 100, 1);

    expect(simulador.avanzarTick().pidEjecutado).toBe(1);

    expect(simulador.consultarEstado().esperandoMemoria).toEqual([2]);
    expect(simulador.consultarEstado().memoria).toEqual([
        { inicio: 0, tamano: 100, pid: null }
    ]);

    expect(simulador.avanzarTick().pidEjecutado).toBe(2);
});

test("no impide admitir otro proceso que si cabe", () => {
    const simulador = new Simulador(100, 2);
    simulador.registrarProceso(1, 60, 3);
    simulador.registrarProceso(2, 50, 3);
    simulador.registrarProceso(3, 40, 3);

    simulador.avanzarTick();

    expect(simulador.consultarEstado().esperandoMemoria).toEqual([2]);
    expect(simulador.consultarEstado().listos).toEqual([3]);

    simulador.avanzarTick();

    expect(simulador.consultarEstado().esperandoMemoria).toEqual([2]);
});

test("el bloqueo conserva memoria y vence en ticks posteriores", () => {
    const simulador = new Simulador(100, 2);
    simulador.registrarProceso(
        1, 100, 3,
        { despuesDeCpu: 1, duracion: 2 }
    );

    simulador.avanzarTick();

    expect(simulador.consultarEstado().bloqueados).toEqual([1]);
    expect(simulador.consultarEstado().procesos[0]?.bloqueoRestante)
        .toBe(2);
    expect(simulador.consultarEstado().memoria).toEqual([
        { inicio: 0, tamano: 100, pid: 1 }
    ]);

    expect(simulador.avanzarTick().pidEjecutado).toBeNull();
    expect(simulador.consultarEstado().procesos[0]?.bloqueoRestante)
        .toBe(1);

    expect(simulador.avanzarTick().pidEjecutado).toBe(1);
    expect(simulador.consultarEstado().procesos[0]?.cpuRestante)
        .toBe(1);
});

test("un evento invalido no deja un registro parcial", () => {
    const simulador = new Simulador(100, 2);

    expect(() => simulador.registrarProceso(
        1, 50, 3,
        { despuesDeCpu: 1, duracion: 0 }
    )).toThrow();

    expect(simulador.consultarEstado().procesos).toEqual([]);

    simulador.registrarProceso(1, 50, 3);

    expect(simulador.consultarEstado().procesos).toHaveLength(1);
});

test("las consultas no exponen el proceso interno", () => {
    const simulador = new Simulador(100, 2);
    simulador.registrarProceso(1, 50, 3);

    const vista = simulador.consultarEstado().procesos[0]!;
    const modificable = vista as { cpuRestante: number };
    modificable.cpuRestante = 999;

    expect(simulador.consultarEstado().procesos[0]?.cpuRestante)
        .toBe(3);
    expect(simulador.consultarEstado().procesos[0]?.estado)
        .toBe(EstadoProceso.Nuevo);
});