import { expect, test } from "vitest";
import { Metricas } from "../src/Metricas.js";

test("en tick cero devuelve los valores iniciales", () => {
    const metricas = new Metricas(100);

    expect(metricas.consultar()).toEqual({
        ocupacionMemoria: 0,
        utilizacionCpu: 0,
        cambiosContexto: 0,
        memoriaLibreTotal: 100,
        mayorBloqueLibre: 100,
        fragmentacionExterna: 0
    });
});

test.each([0, -1, 1.5, NaN, Infinity])(
    "rechaza memoria total invalida %s",
    total => {
        expect(() => new Metricas(total)).toThrow();
    }
);

test("calcula ocupacion de memoria y utilizacion de CPU", () => {
    const metricas = new Metricas(100);
    const bloques = [
        { inicio: 0, tamano: 40, pid: 1 },
        { inicio: 40, tamano: 60, pid: null }
    ];

    metricas.actualizar({
        pidEjecutado: 1,
        pidTerminado: null,
        cambioContexto: false
    }, bloques);

    expect(metricas.consultar().utilizacionCpu).toBe(100);
    expect(metricas.consultar().ocupacionMemoria).toBe(40);

    metricas.actualizar({
        pidEjecutado: null,
        pidTerminado: null,
        cambioContexto: false
    }, bloques);

    expect(metricas.consultar().utilizacionCpu).toBe(50);
    expect(metricas.consultar().memoriaLibreTotal).toBe(60);
    expect(metricas.consultar().mayorBloqueLibre).toBe(60);
});

test("huecos de 100 y 300 producen fragmentacion del 25%", () => {
    const metricas = new Metricas(500);

    metricas.actualizar({
        pidEjecutado: 1,
        pidTerminado: null,
        cambioContexto: false
    }, [
        { inicio: 0, tamano: 100, pid: null },
        { inicio: 100, tamano: 100, pid: 1 },
        { inicio: 200, tamano: 300, pid: null }
    ]);

    expect(metricas.consultar().memoriaLibreTotal).toBe(400);
    expect(metricas.consultar().mayorBloqueLibre).toBe(300);
    expect(metricas.consultar().fragmentacionExterna).toBe(25);
    expect(metricas.consultar().ocupacionMemoria).toBe(20);
});

test("con memoria llena la fragmentacion es cero", () => {
    const metricas = new Metricas(100);

    metricas.actualizar({
        pidEjecutado: 1,
        pidTerminado: null,
        cambioContexto: false
    }, [
        { inicio: 0, tamano: 100, pid: 1 }
    ]);

    expect(metricas.consultar().ocupacionMemoria).toBe(100);
    expect(metricas.consultar().memoriaLibreTotal).toBe(0);
    expect(metricas.consultar().mayorBloqueLibre).toBe(0);
    expect(metricas.consultar().fragmentacionExterna).toBe(0);
});

test("acumula cambios de contexto informados por el planificador", () => {
    const metricas = new Metricas(100);
    const bloques = [{ inicio: 0, tamano: 100, pid: null }];

    metricas.actualizar({
        pidEjecutado: 1,
        pidTerminado: null,
        cambioContexto: true
    }, bloques);

    metricas.actualizar({
        pidEjecutado: 2,
        pidTerminado: null,
        cambioContexto: true
    }, bloques);

    metricas.actualizar({
        pidEjecutado: 2,
        pidTerminado: 2,
        cambioContexto: false
    }, bloques);

    expect(metricas.consultar().cambiosContexto).toBe(2);
});

test("la consulta no permite modificar los contadores internos", () => {
    const metricas = new Metricas(100);
    const vista = metricas.consultar() as {
        cambiosContexto: number;
    };

    vista.cambiosContexto = 999;

    expect(metricas.consultar().cambiosContexto).toBe(0);
});