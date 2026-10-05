import { expect, test } from "vitest";
import { GestorMemoria } from "../src/GestorMemoria.js";

test("inicia con un unico bloque libre", () => {
    const memoria = new GestorMemoria(100);

    expect(memoria.obtenerTotal()).toBe(100);
    expect(memoria.obtenerMapa()).toEqual([
        { inicio: 0, tamano: 100, pid: null }
    ]);
});

test.each([0, -1, 1.5])(
    "rechaza memoria total invalida %s",
    total => {
        expect(() => new GestorMemoria(total)).toThrow();
    }
);

test("divide el bloque cuando sobra espacio", () => {
    const memoria = new GestorMemoria(100);

    expect(memoria.asignar(1, 30)).toBe(true);
    expect(memoria.obtenerMapa()).toEqual([
        { inicio: 0, tamano: 30, pid: 1 },
        { inicio: 30, tamano: 70, pid: null }
    ]);
});

test("el ajuste exacto no crea un bloque de tamano cero", () => {
    const memoria = new GestorMemoria(100);

    expect(memoria.asignar(1, 100)).toBe(true);
    expect(memoria.obtenerMapa()).toEqual([
        { inicio: 0, tamano: 100, pid: 1 }
    ]);
});

test("First-Fit elige el primer hueco suficiente por direccion", () => {
    const memoria = new GestorMemoria(200);
    memoria.asignar(1, 50);
    memoria.asignar(2, 50);
    memoria.asignar(3, 50);
    memoria.liberar(1);

    memoria.asignar(4, 30);

    expect(memoria.obtenerMapa()[0]).toEqual({
        inicio: 0, tamano: 30, pid: 4
    });
});

test("falla sin cambios cuando el libre total esta separado", () => {
    const memoria = new GestorMemoria(100);
    memoria.asignar(1, 30);
    memoria.asignar(2, 40);
    memoria.asignar(3, 30);
    memoria.liberar(1);
    memoria.liberar(3);
    const anterior = memoria.obtenerMapa();

    expect(memoria.asignar(4, 50)).toBe(false);
    expect(memoria.obtenerMapa()).toEqual(anterior);
});

test("fusiona con el vecino libre derecho", () => {
    const memoria = new GestorMemoria(100);
    memoria.asignar(1, 30);

    memoria.liberar(1);

    expect(memoria.obtenerMapa()).toEqual([
        { inicio: 0, tamano: 100, pid: null }
    ]);
});

test("fusiona con el vecino libre izquierdo", () => {
    const memoria = new GestorMemoria(100);
    memoria.asignar(1, 30);
    memoria.asignar(2, 40);
    memoria.asignar(3, 30);
    memoria.liberar(1);

    memoria.liberar(2);

    expect(memoria.obtenerMapa()).toEqual([
        { inicio: 0, tamano: 70, pid: null },
        { inicio: 70, tamano: 30, pid: 3 }
    ]);
});

test("fusiona ambos vecinos y recupera toda la memoria", () => {
    const memoria = new GestorMemoria(100);
    memoria.asignar(1, 30);
    memoria.asignar(2, 40);
    memoria.asignar(3, 30);
    memoria.liberar(1);
    memoria.liberar(3);

    memoria.liberar(2);

    expect(memoria.obtenerMapa()).toEqual([
        { inicio: 0, tamano: 100, pid: null }
    ]);
});

test("rechaza asignar memoria dos veces al mismo PID", () => {
    const memoria = new GestorMemoria(100);
    memoria.asignar(1, 30);
    const anterior = memoria.obtenerMapa();

    expect(() => memoria.asignar(1, 20)).toThrow(
        "El proceso ya tiene memoria"
    );
    expect(memoria.obtenerMapa()).toEqual(anterior);
});

test.each([0, -1, 1.5, 101])(
    "rechaza solicitud de tamano invalido %s",
    tamano => {
        const memoria = new GestorMemoria(100);

        expect(() => memoria.asignar(1, tamano)).toThrow();
        expect(memoria.obtenerMapa()).toEqual([
            { inicio: 0, tamano: 100, pid: null }
        ]);
    }
);

test("rechaza un PID invalido", () => {
    const memoria = new GestorMemoria(100);

    expect(() => memoria.asignar(0, 30)).toThrow();
});

test("rechaza liberar un proceso sin memoria", () => {
    const memoria = new GestorMemoria(100);

    expect(() => memoria.liberar(1)).toThrow(
        "El proceso no tiene memoria asignada"
    );
});

test("modificar una consulta no cambia la memoria interna", () => {
    const memoria = new GestorMemoria(100);
    const consulta = memoria.obtenerMapa();
    const copiaModificable = consulta as Array<{
        inicio: number;
        tamano: number;
        pid: number | null;
    }>;

    copiaModificable[0]!.tamano = 999;
    copiaModificable.push({ inicio: 100, tamano: 20, pid: null });

    expect(memoria.obtenerMapa()).toEqual([
        { inicio: 0, tamano: 100, pid: null }
    ]);
});