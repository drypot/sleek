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
    assert2.throws(function() {
      error.define('NAME_DUPE', '이미 등록되어 있는 이름입니다.', 'name');
    });
    done();
  });
});

describe('error.newError(string)', function () {
  it('should succeed', function () {
    const err = error.newError('INVALID_DATA');
    assert2.e(err.code, error.get('INVALID_DATA').code);
    assert2.e(err.message, error.get('INVALID_DATA').message);
    assert2.ne(err.stack, undefined);
  });
});

describe('error.newError(field error)', function () {
  it('should succeed', function () {
    const err = error.newError('NAME_DUPE');
    assert2.e(err.code, error.get('NAME_DUPE').code);
    assert2.ne(err.stack, undefined);
  })
});

describe('error.newError(unknown)', function () {
  it('should succeed', function () {
    const obj = {opt: 'extra'};
    const err = error.newError(obj);
    assert2.e(err.code, undefined);
    assert2.e(err.message, 'unknown error');
    assert2.e(err.opt, 'extra')
    assert2.ne(err.stack, undefined);
  });
});

describe('error.newFormError(field error)', function () {
  it('should succeed', function () {
    const err = error.newFormError('NAME_DUPE');
    assert2.e(err.code, error.get('INVALID_FORM').code);
    assert2.de(err.errors[0], error.get('NAME_DUPE'));
  })
});

describe('error.newFormError(field error array)', function () {
  it('should succeed', function () {
    const errors = [];
    errors.push(error.get('NAME_DUPE'));
    errors.push(error.get('PASSWORD_EMPTY'));
    const err = error.newFormError(errors);
    assert2.e(err.code, error.get('INVALID_FORM').code);
    assert2.de(err.errors[0], error.get('NAME_DUPE'));
    assert2.de(err.errors[1], error.get('PASSWORD_EMPTY'));
  })
});

describe('error.newFormError(normal error)', function () {
  it('should fail', function () {
    assert2.throws(function () {
      const err = error.newFormError('INVALID_DATA');
    });
  })
});

describe('error.find', function () {
  it('should succeed', function () {
    const err = error.newError('INVALID_DATA');
    assert2.ok(error.find(err, 'INVALID_DATA'));
    assert2.ok(!error.find(err, 'INVALID_FORM'));
    assert2.ok(!error.find(err, 'NAME_DUPE'));
  });
  it('form error should succeed', function () {
    const err = error.newError('NAME_DUPE');
    assert2.ok(!error.find(err, 'INVALID_DATA'));
    assert2.ok(!error.find(err, 'INVALID_FORM'));
    assert2.ok(error.find(err, 'NAME_DUPE'));
  });
});
