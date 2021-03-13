
import * as date2 from "../base/date2.js";
import assert from "assert";
import * as assert2 from "../base/assert2.js";

describe('today', function () {
  it('should succeed', function (done) {
    const now = new Date();
    const today = date2.today();
    assert2.e(today.getFullYear(), now.getFullYear());
    assert2.e(today.getMonth(), now.getMonth());
    assert2.e(today.getDate(), now.getDate());
    assert2.e(today.getHours(), 0);
    assert2.e(today.getMinutes(), 0);
    assert2.e(today.getSeconds(), 0);
    assert2.e(today.getMilliseconds(), 0);
    done();
  });
});

describe('dateFromString', function () {
  it('should succeed', function (done) {
    const d = date2.dateFromString('1974-05-16');
    assert2.e(d.getFullYear(), 1974);
    assert2.e(d.getMonth(), 4);
    assert2.e(d.getDate(), 16);
    assert2.e(d.getHours(), 0);
    assert2.e(d.getMinutes(), 0);
    assert2.e(d.getSeconds(), 0);
    assert2.e(d.getMilliseconds(), 0);
    done();
  });
});

describe('dateTimeString', function () {
  it('should succeed', function () {
    const d = new Date(1974, 4, 16, 12, 0);
    assert2.e(date2.dateTimeString(d), '1974-05-16 12:00:00');
  });
});

describe('dateString', function () {
  it('should succeed', function () {
    const d = new Date(1974, 4, 16, 12, 0);
    assert2.e(date2.dateString(d), '1974-05-16');
  });
});

describe('dateStringNoDash', function () {
  it('should succeed', function () {
    const d = new Date(1974, 4, 16, 12, 0);
    assert2.e(date2.dateStringNoDash(d), '19740516');
  });
});
