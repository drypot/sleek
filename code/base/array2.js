import * as assert2 from "./assert2.js";

export function find(a, fn) {
  for (let i = 0; i < a.length; i++) {
    const item = a[i];
    if (fn(item)) return item;
  }
  return null;
}

export function merge() {
  const tar = arguments[0];
  const fn = arguments[arguments.length - 1];
  for (let a = 1; a < arguments.length - 1; a++) {
    const src = arguments[a];
    sloop:
    for (let s = 0; s < src.length; s++) {
      for (let t = 0; t < tar.length; t++) {
        if (fn(tar[t], src[s])) {
          tar[t] = src[s];
          continue sloop;
        }
      }
      tar.push(src[s]);
    }
  }
}
