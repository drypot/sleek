var init = require('../base/init');
var config = require('../base/config')({ path: 'config/test.json' });
var mysql2 = require('../mysql/mysql2')({ dropDatabase: true });
var assert = require('assert');
var assert2 = require('../base/assert2');

before(function (done) {
  init.run(done);
});

describe('db', function () {
  it('should exist.', function (done) {
    var query = 'select count(*) as c from information_schema.schemata where schema_name = ?';
    mysql2.pool.query(query, config.mysqlDatabase, function (err, r) {
      assert.ifError(err);
      assert2.e(r[0].c, 1);
      done();
    });
  });
});

describe('paging', function () {
  before(function (done) {
    mysql2.pool.query('create table testpaging(id int primary key)', done)
  });
  it('given 10 records', function (done) {
    var sql = 'insert into testpaging(id) values ';
    for (var i = 0; i < 10; i++) {
      if (i > 0) sql += ',';
      sql += '(' + (i+1) + ')';
    };
    mysql2.pool.query(sql, done);
  });
  it('page size 99 should success', function (done) {
    mysql2.findPage('select * from testpaging', 0, 0, 99, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 10);
      assert2.e(r[0].id, 10);
      assert2.e(r[1].id, 9);
      assert2.e(r[2].id, 8);
      assert2.e(r[9].id, 1);
      assert2.e(gt, 0);
      assert2.e(lt, 0);
      done();
    });
  });
  it('page 1 should success', function (done) {
    mysql2.findPage('select * from testpaging', 0, 0, 4, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 4);
      assert2.e(r[0].id, 10);
      assert2.e(r[3].id, 7);
      assert2.e(gt, 0);
      assert2.e(lt, 7);
      done();
    });
  });
  it('page 2 with lt should success', function (done) {
    mysql2.findPage('select * from testpaging', 0, 7, 4, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 4);
      assert2.e(r[0].id, 6);
      assert2.e(r[3].id, 3);
      assert2.e(gt, 6);
      assert2.e(lt, 3);
      done();
    });
  });
  it('last page should success', function (done) {
    mysql2.findPage('select * from testpaging', 0, 3, 4, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 2);
      assert2.e(r[0].id, 2);
      assert2.e(r[1].id, 1);
      assert2.e(gt, 2);
      assert2.e(lt, 0);
      done();
    });
  });
  it('page 2 with gt should success', function (done) {
    mysql2.findPage('select * from testpaging', 2, 0, 4, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 4);
      assert2.e(r[0].id, 6);
      assert2.e(r[3].id, 3);
      assert2.e(gt, 6);
      assert2.e(lt, 3);
      done();
    });
  });
  it('first page should success', function (done) {
    mysql2.findPage('select * from testpaging', 6, 0, 4, function (err, r, gt, lt) {
      assert.ifError(err);
      assert2.e(r.length, 4);
      assert2.e(r[0].id, 10);
      assert2.e(r[3].id, 7);
      assert2.e(gt, 0);
      assert2.e(lt, 7);
      done();
    });
  });
});
