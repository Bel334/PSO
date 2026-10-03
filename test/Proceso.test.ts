import { expect, test } from "vitest";
import { Proceso } from "../src/Proceso.js";

test("el proceso guarda el PID recibido", () => {
    const proceso = new Proceso(1);

    expect(proceso.obtenerPid()).toBe(1);
});
test("rechaza un PID igual a cero", () => {
    expect(() => new Proceso(0)).toThrow(
        "El PID tiene que ser un entero positivo"
    );
});

test("rechaza un PID negativo", () => {
    expect(() => new Proceso(-1)).toThrow(
        "El PID tiene que ser un entero positivo"
    );
});

test("rechaza un PID decimal", () => {
    expect(() => new Proceso(1.5)).toThrow(
        "El PID tiene que ser un entero positivo"
    );
});