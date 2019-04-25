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

describe('waterfall', () => {
  it('should succeed when no err', (done) => {
    async2.waterfall(
      (done) => {
        done(null, 1, 2);
      },
      (p1, p2, done) => {
        assert(p1 === 1);
        assert(p2 === 2);
        done(null, p1, p2, 3, 4);
      },
      (err, p1, p2, p3, p4) => {
        assert.ifError(err);
        assert(p1 === 1);
        assert(p2 === 2);
        assert(p3 === 3);
        assert(p4 === 4);
        done();
      }
    );
  });
  it('should succeed when err', (done) => {
    async2.waterfall(
      (done) => {
        done(null, 1, 2);
      },
      (p1, p2, done) => {
        assert(p1 === 1);
        assert(p2 === 2);
        done("err");
      },
      (err, p1, p2, p3, p4) => {
        assert(err);
        done();
      }
    );
  });
});