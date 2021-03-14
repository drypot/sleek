
import * as init from "../base/init.js";
import * as assert2 from "../base/assert2.js";

describe('init', () => {
  it('should succeed with 3 adds', (done) => {
    let a = [];
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
      assert2.ifError(err);
      assert2.e(a.length, 3);
      assert2.e(a[0], 1);
      assert2.e(a[1], 2);
      assert2.e(a[2], 3);
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
    let a = [];
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
      assert2.ne(err, null);
      assert2.e(a.length, 1);
      assert2.e(a[0], 1);
      done();
    });
  });
});
