import * as assert2 from "../base/assert2.js";

const list = {};

export function define(code, msg, field) {
  assert2.e(list[code], undefined);
  const ec = {
    code: code,
    message: msg
  };
  if (field) {
    ec.field = field;
  }
  list[code] = ec;
}

export function get(code) {
  return list[code];
}

define('INVALID_DATA', '비정상적인 값이 입력되었습니다.');
define('INVALID_FORM', '*');

const INVALID_FORM = get('INVALID_FORM');

export function newError(obj) {
  let err;
  const ec = get(obj);
  if (!ec) {
    err = new Error('unknown error');
    for (let p in obj) {
      err[p] = obj[p];
    }
    return err;
  }
  err = new Error(ec.message);
  err.code = ec.code;
  return err;
}

export function newFormError(obj) {
  let err;
  if (Array.isArray(obj)) {
    err = new Error(INVALID_FORM.message);
    err.code = INVALID_FORM.code;
    err.errors = obj;
    return err;
  }
  const ec = get(obj);
  assert2.ok(ec.field);
  err = new Error(INVALID_FORM.message);
  err.code = INVALID_FORM.code;
  err.errors = [ec];
  return err;
}

export function find(act, code) {
  if (act.code === INVALID_FORM.code) {
    for (let i = 0; i < act.errors.length; i++) {
      const e = act.errors[i];
      if (e.code === code) {
        return true;
      }
    }
  } else {
    if (act.code === code) {
      return true;
    }
  }
  return false;
}
