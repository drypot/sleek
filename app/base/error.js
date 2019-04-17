'use strict';

var assert2 = require('../base/assert2');

var error = exports = module.exports = function (obj) {
  var err;
  if (Array.isArray(obj)) {
    err = new Error(error.INVALID_FORM.message);
    err.code = error.INVALID_FORM.code;
    err.errors = obj;
    return err;
  }
  var ec = error[obj];
  if (!ec) {
    err = new Error('unknown error');
    for (var p in obj) {
      err[p] = obj[p];
    }
    return err;
  }
  if (ec.field) {
    err = new Error(error.INVALID_FORM.message);
    err.code = error.INVALID_FORM.code;
    err.errors = [ec];
    return err;
  }
  err = new Error(ec.message);
  err.code = ec.code;
  return err;
};

error.define = function (code, msg, field) {
  assert2.e(error[code], undefined);
  var ec = error[code] = {
    code: code,
    message: msg
  };
  if (field) {
    ec.field = field;
  }
};

error.define('INVALID_DATA', '비정상적인 값이 입력되었습니다.');
error.define('INVALID_FORM', '*');

error.find = function (act, code) {
  if (act.code === error.INVALID_FORM.code) {
    for (var i = 0; i < act.errors.length; i++) {
      var e = act.errors[i];
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
};
