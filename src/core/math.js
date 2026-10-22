/**
 * Small math and array helpers.
 */

export const rand = (a, b) => a + Math.random() * (b - a);

export const dist = (a, b, c, d) => Math.hypot(a - c, b - d);

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export const lerp = (a, b, t) => a + (b - a) * t;

export const easeOutBack = t => {
  const c1 = 1.9,
    c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export function compact(arr, keepFn) {
  let w = 0;
  for (let i = 0, n = arr.length; i < n; i++) if (keepFn(arr[i])) arr[w++] = arr[i];
  arr.length = w;
}
