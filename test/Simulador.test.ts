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
test("las metricas iniciales corresponden al tick cero", () => {
    const simulador = new Simulador(100, 2);

    expect(simulador.consultarMetricas()).toEqual({
        ocupacionMemoria: 0,
        utilizacionCpu: 0,
        cambiosContexto: 0,
        memoriaLibreTotal: 100,
        mayorBloqueLibre: 100,
        fragmentacionExterna: 0
    });
});

test("las metricas se actualizan despues de liberar memoria", () => {
    const simulador = new Simulador(100, 2);
    simulador.registrarProceso(1, 100, 1);

    simulador.avanzarTick();

    expect(simulador.consultarMetricas()).toEqual({
        ocupacionMemoria: 0,
        utilizacionCpu: 100,
        cambiosContexto: 0,
        memoriaLibreTotal: 100,
        mayorBloqueLibre: 100,
        fragmentacionExterna: 0
    });
});

test("Round-Robin registra un cambio de contexto en el caso minimo", () => {
    const simulador = new Simulador(200, 2);
    simulador.registrarProceso(1, 100, 3);
    simulador.registrarProceso(2, 100, 2);

    Array.from({ length: 5 }, () => simulador.avanzarTick());

    expect(simulador.consultarMetricas().cambiosContexto).toBe(1);
    expect(simulador.consultarMetricas().utilizacionCpu).toBe(100);
});

test("la E/S cuenta contexto y los ticks ociosos reducen utilizacion", () => {
    const simulador = new Simulador(100, 2);
    simulador.registrarProceso(
        1, 100, 3,
        { despuesDeCpu: 1, duracion: 2 }
    );

    simulador.avanzarTick();

    expect(simulador.consultarMetricas().cambiosContexto).toBe(1);
    expect(simulador.consultarMetricas().ocupacionMemoria).toBe(100);

    simulador.avanzarTick();

    expect(simulador.consultarMetricas().utilizacionCpu).toBe(50);
    expect(simulador.consultarMetricas().cambiosContexto).toBe(1);
});

test("quantum sin otros Listos no suma cambios de contexto", () => {
    const simulador = new Simulador(100, 1);
    simulador.registrarProceso(1, 50, 3);

    simulador.avanzarTick();
    simulador.avanzarTick();

    expect(simulador.consultarMetricas().cambiosContexto).toBe(0);
    expect(simulador.consultarMetricas().ocupacionMemoria).toBe(50);
});

test("consultar metricas no avanza el reloj", () => {
    const simulador = new Simulador(100, 2);

    simulador.consultarMetricas();
    simulador.consultarMetricas();

    expect(simulador.consultarEstado().tick).toBe(0);
});
test("la admision ocurre antes del retorno de E/S", () => {
    const simulador = new Simulador(300, 2);

    simulador.registrarProceso(
        1, 100, 3,
        { despuesDeCpu: 1, duracion: 1 }
    );
    simulador.registrarProceso(2, 100, 3);

    simulador.avanzarTick();

    // En el siguiente tick se admite P3 antes de retornar P1.
    simulador.registrarProceso(3, 100, 3);

    const resultado = simulador.avanzarTick();

    expect(resultado.pidEjecutado).toBe(2);
    expect(simulador.consultarEstado().listos).toEqual([3, 1]);
});

test("mide fragmentacion a partir de la memoria real del simulador", () => {
    const simulador = new Simulador(500, 1);
    simulador.registrarProceso(1, 100, 1);
    simulador.registrarProceso(2, 100, 3);

    simulador.avanzarTick();

    expect(simulador.consultarEstado().memoria).toEqual([
        { inicio: 0, tamano: 100, pid: null },
        { inicio: 100, tamano: 100, pid: 2 },
        { inicio: 200, tamano: 300, pid: null }
    ]);

    expect(simulador.consultarMetricas().memoriaLibreTotal).toBe(400);
    expect(simulador.consultarMetricas().mayorBloqueLibre).toBe(300);
    expect(simulador.consultarMetricas().fragmentacionExterna).toBe(25);
});

test("conserva invariantes durante un escenario con espera y E/S", () => {
    const simulador = new Simulador(200, 1);
    simulador.registrarProceso(
        1, 100, 3,
        { despuesDeCpu: 1, duracion: 2 }
    );
    simulador.registrarProceso(2, 100, 2);
    simulador.registrarProceso(3, 100, 1);

    for (let tick = 0; tick < 10; tick++) {
        simulador.avanzarTick();
        const estado = simulador.consultarEstado();

        const ubicaciones = [
            ...estado.listos,
            ...estado.esperandoMemoria,
            ...estado.bloqueados,
            ...estado.terminados,
            ...(estado.pidEnCpu === null ? [] : [estado.pidEnCpu])
        ];

        expect(new Set(ubicaciones).size).toBe(ubicaciones.length);
        expect(ubicaciones.length).toBe(3);

        expect(estado.procesos.filter(
            proceso => proceso.estado === EstadoProceso.Ejecutando
        )).toHaveLength(estado.pidEnCpu === null ? 0 : 1);

        let finAnterior = 0;

        for (const bloque of estado.memoria) {
            expect(bloque.inicio).toBe(finAnterior);
            expect(bloque.tamano).toBeGreaterThan(0);
            finAnterior += bloque.tamano;
        }

        expect(finAnterior).toBe(200);
    }

    expect(simulador.consultarEstado().terminados).toHaveLength(3);
});