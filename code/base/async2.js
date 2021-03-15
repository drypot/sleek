import * as assert2 from "./assert2.js";

export function waterfall(...funcs) {
  let i = 0;
  let e = funcs.length - 1;
  let done = funcs[e];
  let params = [];
  (function loop() {
    if (i === e) {
      return done(null, ...params);
    }
    funcs[i++](...params, (err, ..._params) => {
      if (err) return done(err);
      params = _params;
      setImmediate(loop);
    });
  })();
}
