import { expect, test } from "vitest";
import { Proceso } from "../src/Proceso.js";

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