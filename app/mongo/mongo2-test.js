'use strict';

const init = require('../base/init');
const config = require('../base/config');
const mongo2 = require('../mongo/mongo2');
const assert = require('assert');
const assert2 = require('../base/assert2');

before(function (done) {
  config.path = 'config/test.json';
  mongo2.dropDatabase = true;
  init.run(done);
});

describe('db', function () {
  it('should be opened.', function () {
    assert2.e(mongo2.db.databaseName, config.mongodb);
  });
});

describe('values', function () {
  describe('.update(id, string)', function () {
    it('should succeed', function (done) {
      mongo2.values.update('s1', 'value1', function (err) {
        assert.ifError(err);
        mongo2.values.find('s1', function (err, value) {
          assert.ifError(err);
          assert2.e(value, 'value1');
          done();
        });
      });
    });
  });
  describe('.update(id, number)', function () {
    it('should succeed', function (done) {
      mongo2.values.update('n1', 123, function (err) {
        assert.ifError(err);
        mongo2.values.find('n1', function (err, value) {
          assert.ifError(err);
          assert2.e(value, 123);
          done();
        });
      });
    });
  });
  describe('.update(id, obj)', function () {
    it('should succeed', function (done) {
      mongo2.values.update('o1', { p1: 123, p2: 456 }, function (err) {
        assert.ifError(err);
        mongo2.values.find('o1', function (err, value) {
          assert.ifError(err);
          assert2.de(value, { p1: 123, p2: 456 });
          done();
        });
      });
    });
  });
  describe('.find()', function () {
    it('should return null for undefined', function (done) {
      mongo2.values.find('noname', function (err, value) {
        assert.ifError(err);
        assert2.e(value, null);
        done();
      });
    });
  });
});

describe('.findPage', function () {
  var col;
  before(function (done) {
    col = mongo2.db.collection('testpaging');
    var list = [
      { _id: 1,  a: 'a', b: 'b' },
      { _id: 2,  a: 'a', b: 'b' },
      { _id: 3,  a: 'a', b: 'b' },
      { _id: 4,  a: 'a', b: 'b' },
      { _id: 5,  a: 'a', b: 'b' },
      { _id: 6,  a: 'a', b: 'b' },
      { _id: 7,  a: 'a', b: 'b' },
      { _id: 8,  a: 'a', b: 'b' },
      { _id: 9,  a: 'a', b: 'b' },
      { _id: 10, a: 'a', b: 'b' }
    ];
    col.insertMany(list, done);
  });
  it('should succeed for page size 99', function (done) {
    mongo2.findPage(col, {}, {}, undefined, undefined, 99, null, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 10);
      assert2.e(r[0]._id, 10);
      assert2.e(r[1]._id, 9);
      assert2.e(r[2]._id, 8);
      assert2.e(r[9]._id, 1);
      assert2.e(gt, undefined);
      assert2.e(lt, undefined);
      done();
    });
  });
  it('should succeed for page 1', function (done) {
    mongo2.findPage(col, {}, {}, undefined, undefined, 4, null, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 4);
      assert2.e(r[0]._id, 10);
      assert2.e(r[3]._id, 7);
      assert2.e(gt, undefined);
      assert2.e(lt, 7);
      done();
    });
  });
  it('should succeed for next page ', function (done) {
    mongo2.findPage(col, {}, {}, undefined, 7, 4, null, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 4);
      assert2.e(r[0]._id, 6);
      assert2.e(r[3]._id, 3);
      assert2.e(gt, 6);
      assert2.e(lt, 3);
      done();
    });
  });
  it('should succeed for next page (last page)', function (done) {
    mongo2.findPage(col, {}, {}, undefined, 5, 4, null, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 4);
      assert2.e(r[0]._id, 4);
      assert2.e(r[1]._id, 3);
      assert2.e(r[2]._id, 2);
      assert2.e(r[3]._id, 1);
      assert2.e(gt, 4);
      assert2.e(lt, undefined);
      done();
    });
  });
  it('should succeed for last page (gt = 0)', function (done) {
    mongo2.findPage(col, {}, {}, 0, undefined, 4, null, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 4);
      assert2.e(r[0]._id, 4);
      assert2.e(r[1]._id, 3);
      assert2.e(r[2]._id, 2);
      assert2.e(r[3]._id, 1);
      assert2.e(gt, 4);
      assert2.e(lt, undefined);
      done();
    });
  });
  it('should succeed for previous page', function (done) {
    mongo2.findPage(col, {}, {}, 2, undefined, 4, null, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 4);
      assert2.e(r[0]._id, 6);
      assert2.e(r[3]._id, 3);
      assert2.e(gt, 6);
      assert2.e(lt, 3);
      done();
    });
  });
  it('should succeed for previous page (first page)', function (done) {
    mongo2.findPage(col, {}, {}, 6, undefined, 4, null, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 4);
      assert2.e(r[0]._id, 10);
      assert2.e(r[3]._id, 7);
      assert2.e(gt, undefined);
      assert2.e(lt, 7);
      done();
    });
  });
  it('should succeed with filter', function (done) {
    mongo2.findPage(col, {}, {}, undefined, undefined, 5, filter, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 2);
      assert2.e(r[0]._id, 9);
      assert2.e(r[1]._id, 7);
      assert2.e(gt, undefined);
      assert2.e(lt, 6);
      done();
    });
    function filter(result, done) {
      done(null, result._id % 2 ? result : null);
    }
  });
  it('should succeed with opt', function (done) {
    mongo2.findPage(col, {}, { projection: { _id: 1, a: 1} }, undefined, undefined, 4, null, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 4);
      assert2.ne(r[0]._id, undefined);
      assert2.ne(r[0].a, undefined);
      assert2.e(r[0].b, undefined);
      assert2.e(gt, undefined);
      assert2.e(lt, 7);
      done();
    });
  });
});

describe('.findDeepDoc', function () {
  var col;
  before(function (done) {
    col = mongo2.db.collection('testdeepdoc');
    var list = [
      { _id: 2,  a: 'a', b: 'b', cdate: new Date(2003, 3, 3, 10) },
      { _id: 3,  a: 'a', b: 'b', cdate: new Date(2003, 3, 3, 10) },
      { _id: 4,  a: 'a', b: 'b', cdate: new Date(2003, 3, 3, 10) },
      { _id: 21, a: 'a', b: 'b', cdate: new Date(2012, 3, 7, 10) },
      { _id: 24, a: 'a', b: 'b', cdate: new Date(2012, 3, 8, 11) },
      { _id: 27, a: 'a', b: 'b', cdate: new Date(2012, 3, 9, 12) },
      { _id: 37, a: 'a', b: 'b', cdate: new Date(2013, 3, 7, 10) },
      { _id: 38, a: 'a', b: 'b', cdate: new Date(2013, 3, 8, 11) },
      { _id: 39, a: 'a', b: 'b', cdate: new Date(2013, 3, 9, 12) },
    ];
    col.insertMany(list, done);
  });
  it('should succeed', function (done) {
    mongo2.findDeepDoc(col, {}, {}, new Date(2013, 3, 8), function (err, dyear, dlt) {
      assert.ifError(err);
      assert2.e(dyear, 2013);
      assert2.e(dlt, 38);
      done();
    });
  });
  it('should succeed', function (done) {
    mongo2.findDeepDoc(col, {}, {}, new Date(2012, 12, 12), function (err, dyear, dlt) {
      assert.ifError(err);
      assert2.e(dyear, 2012);
      assert2.e(dlt, 28);
      done();
    });
  });
  it('should succeed', function (done) {
    mongo2.findDeepDoc(col, {}, {}, new Date(2001, 1, 1), function (err, dyear, dlt) {
      assert.ifError(err);
      assert2.e(dyear, undefined);
      assert2.e(dlt, undefined);
      done();
    });
  });
});

describe('.getLastId', function () {
  var col;
  before(function () {
    col = mongo2.db.collection('testlastid');
  });
  it('should succeed for empty collection', function (done) {
    mongo2.getLastId(col, function (err, id) {
      assert.ifError(err);
      assert2.e(id, 0);
      done();
    });
  });
  it('should succeed for filled collection', function (done) {
    var list = [];
    for (var i = 0; i < 10; i++) {
      list.push({ _id: i + 1});
    };
    col.insertMany(list, function (err) {
      assert.ifError(err);
      mongo2.getLastId(col, function (err, id) {
        assert.ifError(err);
        assert2.e(id, 10);
        done();
      });
    });
  });
});
