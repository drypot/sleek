'use strict';

const init = require('../base/init');
const assert = require('assert');
const assert2 = require('../base/assert2');

describe('init.run', function () {
  it('should work', function (done) {
    var a = [];
    init.reset();
    init.add(function (done) {
      a.push(33);
      done();
    });
    init.add(function (done) {
      a.push(77);
      done();
    });
    init.run(function () {
      assert2.e(a.length, 2);
      assert2.e(a[0], 33);
      assert2.e(a[1], 77);
      done();
    });
  });
  it('should pass an error', function (done) {
    var a = [];
    init.reset();
    init.add(function (done) {
      a.push(3);
      done();
    });
    init.add(function (done) {
      try {
        throw new Error('critical');
        done();
      } catch (err) {
        done(err);
      }
    });
    init.run(function (err) {
      assert2.e(a.length, 1);
      assert2.e(a[0], 3);
      assert(err !== null);
      done();
    });
  });
});

describe('init.tail', function () {
  it('should work', function (done) {
    var a = [];
    init.reset();
    init.add(function (done) {
      a.push(3);
      done();
    });
    init.tail(function (done) {
      a.push(10);
      done();
    });
    init.add(function (done) {
      a.push(7);
      done();
    });
    init.run(function () {
      assert2.e(a.length, 3);
      assert2.e(a[0], 3);
      assert2.e(a[1], 7);
      assert2.e(a[2], 10);
      done();
    });
  });
});
