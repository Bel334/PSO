import { expect, test } from "vitest";
import { BloqueMemoria } from "../src/BloqueMemoria.js";

test("crea un bloque libre desde la direccion cero", () => {
    const bloque = new BloqueMemoria(0, 100);

    expect(bloque.obtenerInicio()).toBe(0);
    expect(bloque.obtenerTamano()).toBe(100);
    expect(bloque.obtenerPid()).toBeNull();
    expect(bloque.estaLibre()).toBe(true);
});

test("crea un bloque ocupado por un proceso", () => {
    const bloque = new BloqueMemoria(100, 50, 1);

    expect(bloque.obtenerInicio()).toBe(100);
    expect(bloque.obtenerTamano()).toBe(50);
    expect(bloque.obtenerPid()).toBe(1);
    expect(bloque.estaLibre()).toBe(false);
});

test.each([-1, 1.5, NaN, Infinity])(
    "rechaza inicio invalido %s",
    (inicio) => {
        expect(() => new BloqueMemoria(inicio, 100)).toThrow(
            "El inicio debe ser un entero no negativo"
        );
    }
);

test.each([0, -1, 1.5, NaN, Infinity])(
    "rechaza tamano invalido %s",
    (tamano) => {
        expect(() => new BloqueMemoria(0, tamano)).toThrow(
            "El tamano debe ser un entero positivo"
        );
    }
);

test.each([0, -1, 1.5, NaN, Infinity])(
    "rechaza PID invalido %s",
    (pid) => {
        expect(() => new BloqueMemoria(0, 100, pid)).toThrow(
            "El PID debe ser un entero positivo"
        );
    }
);