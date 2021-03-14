import * as async2 from "../base/async2.js";
import * as assert2 from "../base/assert2.js";

describe('waterfall', () => {
  it('should succeed', (done) => {
    let i = 0;
    async2.waterfall(
      (done) => {
        i++;
        done(null);
      },
      (done) => {
        i++;
        done(null);
      },
      (err) => {
        assert2.ifError(err);
        assert2.e(i, 2);
        done();
      }
    );
  });
  it('should succeed with err', (done) => {
    let i = 0;
    async2.waterfall(
      (done) => {
        i++;
        done(new Error());
      },
      (done) => {
        i++;
        done(null);
      },
      (err) => {
        assert2.ok(err);
        assert2.e(i, 1);
        done();
      }
    );
  });
  it('should succeed with param', (done) => {
    async2.waterfall(
      (done) => {
        done(null, 1, 2);
      },
      (p1, p2, done) => {
        assert2.ok(p1 === 1);
        assert2.ok(p2 === 2);
        done(null, p1, p2, 3, 4);
      },
      (err, p1, p2, p3, p4) => {
        assert2.ifError(err);
        assert2.ok(p1 === 1);
        assert2.ok(p2 === 2);
        assert2.ok(p3 === 3);
        assert2.ok(p4 === 4);
        done();
      }
    );
  });
  it('should succeed with param, err', (done) => {
    async2.waterfall(
      (done) => {
        done(null, 1, 2);
      },
      (p1, p2, done) => {
        assert2.ok(p1 === 1);
        assert2.ok(p2 === 2);
        done("err");
      },
      (err, p1, p2, p3, p4) => {
        assert2.ok(err);
        done();
      }
    );
  });
});
