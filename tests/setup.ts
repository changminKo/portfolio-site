import "@testing-library/jest-dom/vitest";

if (typeof requestAnimationFrame === "undefined") {
  Object.defineProperty(globalThis, "requestAnimationFrame", { configurable: true, value: () => 1 });
  Object.defineProperty(globalThis, "cancelAnimationFrame", {
    configurable: true,
    value: () => undefined,
  });
}
