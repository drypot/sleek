'use strict';

const util = require('util');
const init = exports;

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  process.exit(1);
});

/*
  async 스타일 모듈 초기화 유틸리티.
  가능한 async 한 부분에만 사용하고
  일반적인 정의들은 init.add 밖의 모듈 스코프에 두는 것이 부작용이 적다.
  일반 펑션을 init.add 안에 두면 init.add 간 펑션 사용에 문제가 발생.
*/

var funcs = [];
var tails = [];

init.reset = function () {
  funcs = [];
  tails = [];
}

init.add = function (..._funcs) {
  funcs = funcs.concat(_funcs);
};

init.tail = function (..._funcs) {
  tails = tails.concat(_funcs);
};

init.run = function (done) {
  funcs = funcs.concat(tails);
  var i = 0;
  (function run() {
    if (i == funcs.length) {
      funcs = [];
      tails = [];
      if (done) 
        return done();
      else 
        return;
    }
    var func = funcs[i++];
    func(function (err) {
      if (err) {
        if (done) {
          return done(err);
        }
        throw err;
      }
      setImmediate(run);
    });
  })();
};
