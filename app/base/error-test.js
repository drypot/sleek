'use strict';

const assert = require('assert');
const assert2 = require('../base/assert2');
const init = require('../base/init');
const error = require('../base/error');

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

describe('error(string)', function () {
  it('should succeed', function () {
    var err = error('INVALID_DATA');
    assert2.e(err.code, error.INVALID_DATA.code);
    assert2.e(err.message, error.INVALID_DATA.message);
    assert2.ne(err.stack, undefined);
  });
});

describe('error(field error)', function () {
  it('should succeed', function () {
    var err = error('NAME_DUPE');
    assert2.e(err.code, error.INVALID_FORM.code);
    assert2.de(err.errors[0], error.NAME_DUPE);
  })
});

describe('error(field errors)', function () {
  it('should succeed', function () {
    var errors = [];
    errors.push(error.NAME_DUPE);
    errors.push(error.PASSWORD_EMPTY);
    var err = error(errors);
    assert2.e(err.code, error.INVALID_FORM.code);
    assert2.de(err.errors[0], error.NAME_DUPE);
    assert2.de(err.errors[1], error.PASSWORD_EMPTY);
  })
});

describe('error(unknown)', function () {
  it('should succeed', function () {
    var obj = { opt: 'extra' };
    var err = error(obj);
    assert2.e(err.code, undefined);
    assert2.e(err.message, 'unknown error');
    assert2.e(err.opt, 'extra')
    assert2.ne(err.stack, undefined);
  });
});

describe('error.find', function () {
  it('should succeed', function () {
    var err = error('INVALID_DATA');
    assert(error.find(err, 'INVALID_DATA'));
    assert(!error.find(err, 'INVALID_FORM'));
    assert(!error.find(err, 'NAME_DUPE'));
  });
  it('form error should succeed', function () {
    var err = error('NAME_DUPE');
    assert(!error.find(err, 'INVALID_DATA'));
    assert(!error.find(err, 'INVALID_FORM'));
    assert(error.find(err, 'NAME_DUPE'));
  });
});
