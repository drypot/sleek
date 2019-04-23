'use strict';

const assert = require('assert');
const assert2 = require('../base/assert2');

describe('aliases', function () {
  it('should succeed', function (done) {
    assert2.e('abc', 'abc');
    assert2.ne('abc', 'def');
    assert2.de([1], [1]);
    assert2.nde([1], [2]);
    done();
  });
});

describe('emtpy', function () {
  it('should succeed', function (done) {
    assert2.empty(undefined);
    assert2.empty(null);
    assert2.empty({});
    assert.throws(function () {
      assert2.empty({ a: 1 });
    });
    done();
  });
});

describe('notEmtpy', function () {
  it('should succeed', function (done) {
    assert2.notEmpty({ a: 1 });
    assert.throws(function () {
      assert2.notEmpty({});
    });
    done();
  });
});

describe('path', function () {
  it('should succeed', function (done) {
    assert2.path('app/base/assert2.js');
    assert2.path('app/base/assertX.js', false);
    done();
  });
});

describe('redirect', function () {
  it('should succeed', function (done) {
    assert2.redirect({
      status: 301,
      header: {
        location: '/new301'
      }
    }, '/new301');
    assert2.redirect({
      status: 302,
      header: {
        location: '/new302'
      }
    }, '/new302');
    done();
  });
});
