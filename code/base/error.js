import * as assert2 from "../base/assert2.js";

const list = {};

export function define(code, msg, field) {
  assert2.e(list[code], undefined);
  const ec = list[code] = {
    code: code,
    message: msg
  };
  if (field) {
    ec.field = field;
  }
}

export function get(code) {
  return list[code];
}

define('INVALID_DATA', '비정상적인 값이 입력되었습니다.');
define('INVALID_FORM', '*');

const INVALID_FORM = get('INVALID_FORM');

export function from(obj) {
  let err;
  if (Array.isArray(obj)) {
    err = new Error(INVALID_FORM.message);
    err.code = INVALID_FORM.code;
    err.errors = obj;
    return err;
  }
  const ec = get(obj);
  if (!ec) {
    err = new Error('unknown error');
    for (let p in obj) {
      err[p] = obj[p];
    }
    return err;
  }
  if (ec.field) {
    err = new Error(INVALID_FORM.message);
    err.code = INVALID_FORM.code;
    err.errors = [ec];
    return err;
  }
  err = new Error(ec.message);
  err.code = ec.code;
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
