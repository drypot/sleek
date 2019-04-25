'use strict';

const async2 = require('../base/async2');
const assert = require('assert');
const assert2 = require('../base/assert2');

describe('if', function () {
  it('3 func true case should succeed', function () {
    var r;
    async2.if(true, function (next) {
      r = '123';
      next('456');
    }, function (next) {
      r = 'abc';
      next('def');
    }, function (p) {
      assert2.e(r, '123');
      assert2.e(p, '456');
    });
  });
  it('3 func false case should succeed', function () {
    var r;
    async2.if(false, function (next) {
      r = '123';
      next('456');
    }, function (next) {
      r = 'abc';
      next('def');
    }, function (p) {
      assert2.e(r, 'abc');
      assert2.e(p, 'def');
    });
  });
  it('2 func true case should succeed', function () {
    var r;
    async2.if(true, function (next) {
      r = '123';
      next('456');
    }, function (p) {
      assert2.e(r, '123');
      assert2.e(p, '456');
    });
  });
  it('2 func false case should succeed', function () {
    var r;
    async2.if(false, function (next) {
      r = '123';
      next('456');
    }, function (p) {
      assert2.e(r, undefined);
      assert2.e(p, undefined);
    });
  });
});
