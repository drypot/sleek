'use strict';

const init = require('../base/init');
const assert = require('assert');
const assert2 = require('../base/assert2');

describe('init', () => {
  it('should succeed with 3 adds', (done) => {
    var a = [];
    init.reset();
    init.add((done) => {
      a.push(1);
      done();
    });
    init.add(
      (done) => {
        a.push(2);
        done();
      },
      (done) => {
        a.push(3);
        done();
      }
    );
    init.run((err) => {
      assert.ifError(err);
      assert2.e(a.length, 3);
      assert2.e(a[0], 1);
      assert2.e(a[1], 2);
      assert2.e(a[2], 3);
      done();
    });
  });
  it('should succeed with 3 tails', (done) => {
    var a = [];
    init.reset();
    init.tail((done) => {
      a.push(7);
      done();
    });
    init.tail(
      (done) => {
        a.push(8);
        done();
      },
      (done) => {
        a.push(9);
        done();
      }
    );
    init.add((done) => {
      a.push(1);
      done();
    });
    init.run((err) => {
      assert.ifError(err);
      assert2.e(a.length, 4);
      assert2.e(a[0], 1);
      assert2.e(a[1], 7);
      assert2.e(a[2], 8);
      assert2.e(a[3], 9);
      done();
    });
  });
  it('should succeed with no funcs', (done) => {
    init.reset();
    init.run(done);
  });
  it('should succeed without done', (done) => {
    init.reset();
    init.run();
    done();
  });
  it('should pass an error', (done) => {
    var a = [];
    init.reset();
    init.add(
      (done) => {
        a.push(1);
        done();
      },
      (done) => {
        done(new Error('err1'));
      },
      (done) => {
        a.push(3);
        done();
      }
    );
    init.run((err) => {
      assert(err);
      assert2.e(a.length, 1);
      assert2.e(a[0], 1);
      done();
    });
  });
});
