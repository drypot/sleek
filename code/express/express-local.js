import superagent from "superagent";
import * as config from '../base/config.js';
import * as assert2 from "../base/assert2.js";

// user-fixture 와 같이 여러 테스트 모듈이 세션을 공유할 필요가 있다.
// 각 모듈별로 supertest 류의 라이브러리를 각자 생성해서 사용하면 세션 공유에 문제가 발생한다.
// 세션을 별도 공용 모듈에서 유지해야한다.

// superagent 에 fields 펑션을 추가한다.
// multipart/form-data 타입으로 첨부 파일을 보낼 때
// 폼 필드 전달을 쉽게 할 수 있다.

assert2.strictEqual(superagent.Request.prototype.fields, undefined);

superagent.Request.prototype.fields = function(obj){
  for (let key in obj) {
    const val = obj[key];
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        this.field(key, val[i]);
      }
      continue;
    }
    this.field(key, val);
  }
  return this;
};

// expl

let agent;

export function newAgent() {
  agent = superagent.agent();
}

newAgent();

function prepareArgs(a) {
  a[0] = 'http://localhost:' + config.prop.appPort + a[0];
}

export function post() {
  prepareArgs(arguments);
  return agent.post.apply(agent, arguments);
}

export function get() {
  prepareArgs(arguments);
  return agent.get.apply(agent, arguments);
}

export function put() {
  prepareArgs(arguments);
  return agent.put.apply(agent, arguments);
}

export function del() {
  prepareArgs(arguments);
  return agent.del.apply(agent, arguments);
}
