var init = require('../base/init');
var config = require('../base/config')({ path: 'config/test.json' });
var mongob = require('../mongo/mongo-base')({ dropDatabase: true });
var assert = require('assert');
var assert2 = require('../base/assert2');

before(function (done) {
  init.run(done);
});

describe('db', function () {
  it('should have been opened.', function () {
    assert2.e(mongob.db.databaseName, config.mongodb);
  });
});

describe('paging', function () {
  var col;
  it('given 10 records', function (done) {
    col = mongob.db.collection('testpaging');
    var list = [];
    for (var i = 0; i < 10; i++) {
      list.push({ _id: i + 1});
    };
    col.insertMany(list, done);    
  });
  it('page size 99 should success', function (done) {
    mongob.findPage(col, {}, 0, 0, 99, null, function (err, results, gt, lt) {
      assert.ifError(err);
      assert2.e(results.length, 10);
      assert2.e(results[0]._id, 10);
      assert2.e(results[1]._id, 9);
      assert2.e(results[2]._id, 8);
      assert2.e(results[9]._id, 1);
      assert2.e(gt, 0);
      assert2.e(lt, 0);
      done();
    });
  });
  it('page 1 should success', function (done) {
    mongob.findPage(col, {}, 0, 0, 4, null, function (err, results, gt, lt) {
      assert.ifError(err);
      assert2.e(results.length, 4);
      assert2.e(results[0]._id, 10);
      assert2.e(results[3]._id, 7);
      assert2.e(gt, 0);
      assert2.e(lt, 7);
      done();
    });
  });
  it('page 2 with lt should success', function (done) {
    mongob.findPage(col, {}, 0, 7, 4, null, function (err, results, gt, lt) {
      assert.ifError(err);
      assert2.e(results.length, 4);
      assert2.e(results[0]._id, 6);
      assert2.e(results[3]._id, 3);
      assert2.e(gt, 6);
      assert2.e(lt, 3);
      done();
    });
  });
  it('last page should success', function (done) {
    mongob.findPage(col, {}, 0, 3, 4, null, function (err, results, gt, lt) {
      assert.ifError(err);
      assert2.e(results.length, 2);
      assert2.e(results[0]._id, 2);
      assert2.e(results[1]._id, 1);
      assert2.e(gt, 2);
      assert2.e(lt, 0);
      done();
    });
  });
  it('page 2 with gt should success', function (done) {
    mongob.findPage(col, {}, 2, 0, 4, null, function (err, results, gt, lt) {
      assert.ifError(err);
      assert2.e(results.length, 4);
      assert2.e(results[0]._id, 6);
      assert2.e(results[3]._id, 3);
      assert2.e(gt, 6);
      assert2.e(lt, 3);
      done();
    });
  });
  it('first page should success', function (done) {
    mongob.findPage(col, {}, 6, 0, 4, null, function (err, results, gt, lt) {
      assert.ifError(err);
      assert2.e(results.length, 4);
      assert2.e(results[0]._id, 10);
      assert2.e(results[3]._id, 7);
      assert2.e(gt, 0);
      assert2.e(lt, 7);
      done();
    });
  });
  it('filter should success', function (done) {
    mongob.findPage(col, {}, 0, 0, 5, filter, function (err, results, gt, lt) {
      assert.ifError(err);
      assert2.e(results.length, 2);
      assert2.e(results[0]._id, 9);
      assert2.e(results[1]._id, 7);
      assert2.e(gt, 0);
      assert2.e(lt, 6);
      done();
    });
    function filter(result, done) {
      done(null, result._id % 2 ? result : null);
    }
  });
});

describe('getLastId', function () {
  var col;
  it('given empty collection', function () {
    col = mongob.db.collection('testlastid');
  });
  it('should success', function (done) {
    mongob.getLastId(col, function (err, id) {
      assert.ifError(err);
      assert2.e(id, 0);
      done();
    });
  });
  it('given 10 records', function (done) {
    var list = [];
    for (var i = 0; i < 10; i++) {
      list.push({ _id: i + 1});
    };
    col.insertMany(list, done);    
  });
  it('should success', function (done) {
    mongob.getLastId(col, function (err, id) {
      assert.ifError(err);
      assert2.e(id, 10);
      done();
    });
  });
});
