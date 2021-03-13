
process.on('uncaughtException', function (err) {
  console.error(err.stack);
  process.exit(1);
});

/*
  async 스타일 모듈 초기화 유틸리티.
  가능한 async 한 부분에만 사용하고
  일반적인 정의들은 add 밖의 모듈 스코프에 두는 것이 부작용이 적다.
  일반 펑션을 add 안에 두면 add 간 펑션 사용에 문제가 발생.
*/

let funcs = [];

export function reset() {
  funcs = [];
}

export function add(..._funcs) {
  funcs = funcs.concat(_funcs);
}

export function run(done) {
  let i = 0;
  (function run() {
    if (i === funcs.length) {
      funcs = [];
      if (done)
        return done();
      else
        return;
    }
    let func = funcs[i++];
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
}
