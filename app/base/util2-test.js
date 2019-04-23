'use strict';

const util2 = require('../base/util2');
const assert = require('assert');
const assert2 = require('../base/assert2');

describe('find', function () {
  it('should succeed', function () {
    var item = util2.find([ 1, 2, 3], function (item) {
      return item === 2;
    });
    assert2.e(item, 2);
  });
  it('should succeed', function () {
    var item = util2.find([ 1, 2, 3], function (item) {
      return item === 4;
    });
    assert2.e(item, null);
  });
});

describe('mergeArray', function () {
  function eq(item1, item2) {
    return item1.name === item2.name;
  }
  it('should succeed', function () {
    var obj1 = [];
    var obj2 = [{ name: 'n1', value: 'v1' }];
    util2.mergeArray(obj1, obj2, eq);
    assert2.e(obj1.length, 1);
    assert2.e(obj1[0].name, 'n1');
    assert2.e(obj1[0].value, 'v1');
  });
  it('should succeed', function () {
    var obj1 = [{ name: 'n1', value: 'v1' }, { name: 'n2', value: 'v2' }];
    var obj2 = [{ name: 'n2', value: 'v2n' }, { name: 'n3', value: 'v3n' }, { name: 'n4', value: 'v4n' }];
    util2.mergeArray(obj1, obj2, eq);
    assert2.e(obj1.length, 4);
    assert2.e(obj1[0].name, 'n1');
    assert2.e(obj1[0].value, 'v1');
    assert2.e(obj1[1].name, 'n2');
    assert2.e(obj1[1].value, 'v2n');
    assert2.e(obj1[2].name, 'n3');
    assert2.e(obj1[2].value, 'v3n');
    assert2.e(obj1[3].name, 'n4');
    assert2.e(obj1[3].value, 'v4n');
  });
});

describe('fif', function () {
  it('3 func true case should succeed', function () {
    var r;
    util2.fif(true, function (next) {
      r = '123';
      next('456');
    }, function (next) {
      r = 'abc';
      next('def');
    }, function (p) {
      assert2.e(r, '123');
      assert2.e(p, '456');
    })
  });
  it('3 func false case should succeed', function () {
    var r;
    util2.fif(false, function (next) {
      r = '123';
      next('456');
    }, function (next) {
      r = 'abc';
      next('def');
    }, function (p) {
      assert2.e(r, 'abc');
      assert2.e(p, 'def');
    })
  });
  it('2 func true case should succeed', function () {
    var r;
    util2.fif(true, function (next) {
      r = '123';
      next('456');
    }, function (p) {
      assert2.e(r, '123');
      assert2.e(p, '456');
    })
  });
  it('2 func false case should succeed', function () {
    var r;
    util2.fif(false, function (next) {
      r = '123';
      next('456');
    }, function (p) {
      assert2.e(r, undefined);
      assert2.e(p, undefined);
    })
  });
});

describe('pass', function () {
  it('should succeed', function (done) {
    util2.pass(function (err) {
      assert.ifError(err);
      done();
    });
  });
  it('should succeed', function (done) {
    util2.pass(1, 2, 3, function (err) {
      assert.ifError(err);
      done();
    });
  });
});

describe('today', function () {
  it('should succeed', function (done) {
    var now = new Date();
    var today = util2.today();
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
    var d = util2.dateFromString('1974-05-16');
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
    var d = new Date(1974, 4, 16, 12, 0);
    assert2.e(util2.dateTimeString(d), '1974-05-16 12:00:00');
  });
});

describe('dateString', function () {
  it('should succeed', function () {
    var d = new Date(1974, 4, 16, 12, 0);
    assert2.e(util2.dateString(d), '1974-05-16');
  });
});

describe('dateStringNoDash', function () {
  it('should succeed', function () {
    var d = new Date(1974, 4, 16, 12, 0);
    assert2.e(util2.dateStringNoDash(d), '19740516');
  });
});

describe('url', function () {
  it('should succeed', function () {
    var params = { a: 10 };
    var params2 = { a: 10, b: 'big'};
    assert2.e(util2.url('http://localhost/test'), 'http://localhost/test');
    assert2.e(util2.url('http://localhost/test', params), 'http://localhost/test?a=10');
    assert2.e(util2.url('http://localhost/test', params2), 'http://localhost/test?a=10&b=big');
  });
});

describe("UrlMaker", function () {
  it("url should succeed", function () {
    assert2.e(new util2.UrlMaker('/thread').done(), '/thread');
  });
  it("query param should succeed", function () {
    assert2.e(new util2.UrlMaker('/thread').add('p', 10).done(), '/thread?p=10');
  });
  it("query params should succeed", function () {
    assert2.e(new util2.UrlMaker('/thread').add('p', 10).add('ps', 16).done(), '/thread?p=10&ps=16');
  });
  it("default value should succeed", function () {
    assert2.e(new util2.UrlMaker('/thread').add('p', 0, 0).add('ps', 16, 32).done(), '/thread?ps=16');
  });
});
