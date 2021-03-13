
import assert from "assert";
import * as assert2 from "../base/assert2.js";
import * as init from "../base/init.js";
import * as error from "../base/error.js";

before(function (done) {
  init.run(done);
});

before(function () {
  error.define('NAME_DUPE', '이미 등록되어 있는 이름입니다.', 'name');
  error.define('PASSWORD_EMPTY', '비밀번호를 입력해 주십시오.', 'password');
});

describe('defining duplicated', function () {
  it('should fail', function (done) {
    assert.throws(function() {
      error.define('NAME_DUPE', '이미 등록되어 있는 이름입니다.', 'name');
    });
    done();
  });
});

describe('error.from(string)', function () {
  it('should succeed', function () {
    const err = error.from('INVALID_DATA');
    assert2.e(err.code, error.get('INVALID_DATA').code);
    assert2.e(err.message, error.get('INVALID_DATA').message);
    assert2.ne(err.stack, undefined);
  });
});

describe('error.from(field error)', function () {
  it('should succeed', function () {
    const err = error.from('NAME_DUPE');
    assert2.e(err.code, error.get('INVALID_FORM').code);
    assert2.de(err.errors[0], error.get('NAME_DUPE'));
  })
});

describe('error.from(field errors)', function () {
  it('should succeed', function () {
    const errors = [];
    errors.push(error.get('NAME_DUPE'));
    errors.push(error.get('PASSWORD_EMPTY'));
    const err = error.from(errors);
    assert2.e(err.code, error.get('INVALID_FORM').code);
    assert2.de(err.errors[0], error.get('NAME_DUPE'));
    assert2.de(err.errors[1], error.get('PASSWORD_EMPTY'));
  })
});

describe('error.from(unknown)', function () {
  it('should succeed', function () {
    const obj = {opt: 'extra'};
    const err = error.from(obj);
    assert2.e(err.code, undefined);
    assert2.e(err.message, 'unknown error');
    assert2.e(err.opt, 'extra')
    assert2.ne(err.stack, undefined);
  });
});

describe('error.find', function () {
  it('should succeed', function () {
    const err = error.from('INVALID_DATA');
    assert(error.find(err, 'INVALID_DATA'));
    assert(!error.find(err, 'INVALID_FORM'));
    assert(!error.find(err, 'NAME_DUPE'));
  });
  it('form error should succeed', function () {
    const err = error.from('NAME_DUPE');
    assert(!error.find(err, 'INVALID_DATA'));
    assert(!error.find(err, 'INVALID_FORM'));
    assert(error.find(err, 'NAME_DUPE'));
  });
});
