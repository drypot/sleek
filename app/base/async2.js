'use strict';

const async2 = exports;

async2.if = function (condi, f1, f2, f3) {
  if (f3) {
    if (condi) {
      f1(f3);
    } else {
      f2(f3);
    }
  } else {
    if (condi) {
      f1(f2);
    } else {
      f2();
    }    
  }
};

/*
async.waterfall([
    function(callback) {
        callback(null, 'one', 'two');
    },
    function(arg1, arg2, callback) {
        // arg1 now equals 'one' and arg2 now equals 'two'
        callback(null, 'three');
    },
    function(arg1, callback) {
        // arg1 now equals 'three'
        callback(null, 'done');
    }
], function (err, result) {
    // result now equals 'done'
});
*/

async2.waterfall = function (...funcs) {
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