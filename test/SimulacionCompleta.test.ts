import { expect, test } from "vitest";
import { Simulador } from "../src/Simulador.js";

test("simulacion completa con 800 KB, Round-Robin y E/S", () => {
    const simulador = new Simulador(800, 2);

    simulador.registrarProceso(
        1, 200, 2,
        { despuesDeCpu: 1, duracion: 2 }
    );

    simulador.registrarProceso(2, 300, 1);

    simulador.registrarProceso(
        3, 400, 2,
        { despuesDeCpu: 1, duracion: 1 }
    );

    simulador.registrarProceso(4, 200, 3);

    const ejecuciones: Array<number | null> = [];

    // Tick 1: P1 ejecuta y se bloquea. P3 no encuentra memoria.
    ejecuciones.push(simulador.avanzarTick().pidEjecutado);

    expect(simulador.consultarEstado().esperandoMemoria).toEqual([3]);
    expect(simulador.consultarEstado().bloqueados).toEqual([1]);
    expect(simulador.consultarEstado().listos).toEqual([2, 4]);

    expect(simulador.consultarEstado().memoria).toEqual([
        { inicio: 0, tamano: 200, pid: 1 },
        { inicio: 200, tamano: 300, pid: 2 },
        { inicio: 500, tamano: 200, pid: 4 },
        { inicio: 700, tamano: 100, pid: null }
    ]);

    // Tick 2: P2 termina. Hay 400 KB libres, pero separados.
    ejecuciones.push(simulador.avanzarTick().pidEjecutado);

    expect(simulador.consultarMetricas().memoriaLibreTotal).toBe(400);
    expect(simulador.consultarMetricas().mayorBloqueLibre).toBe(300);
    expect(simulador.consultarMetricas().fragmentacionExterna).toBe(25);

    // Tick 3: P3 sigue sin caber. P1 retorna y P4 ejecuta.
    ejecuciones.push(simulador.avanzarTick().pidEjecutado);

    expect(simulador.consultarEstado().esperandoMemoria).toEqual([3]);
    expect(simulador.consultarEstado().bloqueados).toEqual([]);
    expect(simulador.consultarEstado().pidEnCpu).toBe(4);
    expect(simulador.consultarEstado().listos).toEqual([1]);

    // Tick 4: P4 agota el quantum y vuelve al final de Listos.
    ejecuciones.push(simulador.avanzarTick().pidEjecutado);

    expect(simulador.consultarEstado().pidEnCpu).toBeNull();
    expect(simulador.consultarEstado().listos).toEqual([1, 4]);
    expect(simulador.consultarMetricas().cambiosContexto).toBe(2);

    // Tick 5: P1 termina. La coalescencia forma un hueco de 500 KB.
    ejecuciones.push(simulador.avanzarTick().pidEjecutado);

    expect(simulador.consultarEstado().memoria).toEqual([
        { inicio: 0, tamano: 500, pid: null },
        { inicio: 500, tamano: 200, pid: 4 },
        { inicio: 700, tamano: 100, pid: null }
    ]);

    // P3 espera hasta la proxima fase de admision.
    expect(simulador.consultarEstado().esperandoMemoria).toEqual([3]);

    // Tick 6: P3 es admitido. P4 ejecuta su ultimo tick.
    ejecuciones.push(simulador.avanzarTick().pidEjecutado);

    expect(simulador.consultarEstado().esperandoMemoria).toEqual([]);
    expect(simulador.consultarEstado().listos).toEqual([3]);
    expect(simulador.consultarEstado().memoria).toEqual([
        { inicio: 0, tamano: 400, pid: 3 },
        { inicio: 400, tamano: 400, pid: null }
    ]);

    // Tick 7: P3 ejecuta y se bloquea durante un tick.
    ejecuciones.push(simulador.avanzarTick().pidEjecutado);

    expect(simulador.consultarEstado().bloqueados).toEqual([3]);
    expect(simulador.consultarEstado().procesos[2]?.bloqueoRestante)
        .toBe(1);
    expect(simulador.consultarMetricas().cambiosContexto).toBe(3);

    // Tick 8: vence el bloqueo, P3 ejecuta y termina.
    ejecuciones.push(simulador.avanzarTick().pidEjecutado);

    expect(ejecuciones).toEqual([1, 2, 4, 4, 1, 4, 3, 3]);

    const final = simulador.consultarEstado();

    expect(final.tick).toBe(8);
    expect(final.pidEnCpu).toBeNull();
    expect(final.listos).toEqual([]);
    expect(final.esperandoMemoria).toEqual([]);
    expect(final.bloqueados).toEqual([]);
    expect(final.terminados).toEqual([1, 2, 3, 4]);
    expect(final.procesos.every(proceso => proceso.cpuRestante === 0))
        .toBe(true);
    expect(final.memoria).toEqual([
        { inicio: 0, tamano: 800, pid: null }
    ]);

    expect(simulador.consultarMetricas()).toEqual({
        ocupacionMemoria: 0,
        utilizacionCpu: 100,
        cambiosContexto: 3,
        memoriaLibreTotal: 800,
        mayorBloqueLibre: 800,
        fragmentacionExterna: 0
    });
});