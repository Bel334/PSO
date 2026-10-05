import { expect, test } from "vitest";
import { Proceso } from "../src/Proceso.js";
import { EstadoProceso } from "../src/EstadoProceso.js";
import { PlanificadorRoundRobin } from "../src/PlanificadorRoundRobin.js";

test.each([0, -1, 1.5])(
    "rechaza quantum invalido %s",
    quantum => {
        expect(() => new PlanificadorRoundRobin(quantum)).toThrow();
    }
);

test("sin procesos no consume CPU", () => {
    const planificador = new PlanificadorRoundRobin(2);

    expect(planificador.ejecutarTick()).toEqual({
        pidEjecutado: null,
        pidTerminado: null,
        cambioContexto: false
    });
    expect(planificador.obtenerPidEnCpu()).toBeNull();
});

test("cumple la secuencia minima de Round-Robin", () => {
    const planificador = new PlanificadorRoundRobin(2);
    const p1 = new Proceso(1, 100, 3);
    const p2 = new Proceso(2, 100, 2);
    p1.admitir();
    p2.admitir();
    planificador.encolar(p1);
    planificador.encolar(p2);

    expect(planificador.obtenerListos()).toEqual([1, 2]);

    const resultados = Array.from(
        { length: 5 },
        () => planificador.ejecutarTick()
    );

    expect(resultados.map(resultado => resultado.pidEjecutado))
        .toEqual([1, 1, 2, 2, 1]);

    expect(resultados.filter(resultado => resultado.cambioContexto))
        .toHaveLength(1);

    expect(p1.obtenerEstado()).toBe(EstadoProceso.Terminado);
    expect(p2.obtenerEstado()).toBe(EstadoProceso.Terminado);
    expect(planificador.obtenerListos()).toEqual([]);
    expect(planificador.obtenerPidEnCpu()).toBeNull();
});

test("un proceso solo renueva quantum sin cambio de contexto", () => {
    const planificador = new PlanificadorRoundRobin(2);
    const proceso = new Proceso(1, 100, 3);
    proceso.admitir();
    planificador.encolar(proceso);

    planificador.ejecutarTick();
    const resultado = planificador.ejecutarTick();

    expect(resultado.cambioContexto).toBe(false);
    expect(proceso.obtenerQuantumConsumido()).toBe(0);
    expect(proceso.obtenerCpuRestante()).toBe(1);
    expect(planificador.obtenerPidEnCpu()).toBe(1);
});

test("finalizar en el limite de quantum no reencola", () => {
    const planificador = new PlanificadorRoundRobin(2);
    const p1 = new Proceso(1, 100, 2);
    const p2 = new Proceso(2, 100, 1);
    p1.admitir();
    p2.admitir();
    planificador.encolar(p1);
    planificador.encolar(p2);

    planificador.ejecutarTick();
    const resultado = planificador.ejecutarTick();

    expect(resultado.pidTerminado).toBe(1);
    expect(resultado.cambioContexto).toBe(false);
    expect(planificador.obtenerListos()).toEqual([2]);
    expect(p2.obtenerCpuRestante()).toBe(1);
    expect(planificador.obtenerPidEnCpu()).toBeNull();
});

test("rechaza procesos que no estan Listos", () => {
    const planificador = new PlanificadorRoundRobin(2);
    const proceso = new Proceso(1, 100, 3);

    expect(() => planificador.encolar(proceso)).toThrow(
        "Solo se pueden encolar procesos Listos"
    );
});

test("rechaza duplicados en la cola", () => {
    const planificador = new PlanificadorRoundRobin(2);
    const proceso = new Proceso(1, 100, 3);
    proceso.admitir();
    planificador.encolar(proceso);

    expect(() => planificador.encolar(proceso)).toThrow(
        "El proceso ya esta en el planificador"
    );
    expect(planificador.obtenerListos()).toEqual([1]);
});

test("la consulta no permite modificar la cola interna", () => {
    const planificador = new PlanificadorRoundRobin(2);
    const proceso = new Proceso(1, 100, 3);
    proceso.admitir();
    planificador.encolar(proceso);

    const consulta = planificador.obtenerListos() as number[];
    consulta.push(99);

    expect(planificador.obtenerListos()).toEqual([1]);
});