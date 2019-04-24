'use strict';

const init = require('../base/init');
const config = require('../base/config');
const mysql2 = require('../mysql/mysql2');
const assert = require('assert');
const assert2 = require('../base/assert2');

before(function (done) {
  config.path = 'config/test.json';
  mysql2.dropDatabase = true;
  init.run(done);
});

describe('db', function () {
  it('should exist.', function (done) {
    var query = 'show databases like ?';
    mysql2.query(query, config.mysqlDatabase, function (err, r) {
      assert.ifError(err);
      assert(r.length);
      done();
    });
  });
});

describe('queryOne', (done) => {
  it('should succeed when result exists.', done => {
    mysql2.queryOne('select * from (select 1 as id) dummy where id = 1', (err, r) => {
      assert.ifError(err);
      assert(r.id === 1);
      done();      
    });
  });
  it('should succeed when result does not exists.', done => {
    mysql2.queryOne('select * from (select 1 as id) dummy where id = 2', (err, r) => {
      assert.ifError(err);
      console.log(r);
      assert(r === undefined);
      done();      
    });
  });
});

describe('tableExists', () => {
  before((done) => {
    mysql2.query('create table test_exist(id int)', done);
  })
  it('should return false when table not exists.', done => {
    mysql2.tableExists('test_exist_xxx', (err, exist) => {
      assert.ifError(err);
      assert2.e(exist, false);
      done();
    });
  });  
  it('should return true when table exists.', done => {
    mysql2.tableExists('test_exist', (err, exist) => {
      assert.ifError(err);
      assert2.e(exist, true);
      done();
    });
  });  
});

describe('paging', function () {
  before(function (done) {
    mysql2.query('create table test_paging(id int primary key)', done)
  });
  it('given 10 records', function (done) {
    var sql = 'insert into test_paging(id) values ';
    for (var i = 0; i < 10; i++) {
      if (i > 0) sql += ',';
      sql += '(' + (i+1) + ')';
    };
    mysql2.query(sql, done);
  });
  it('page size 99 should success', function (done) {
    mysql2.findPage('select * from test_paging', 0, 0, 99, function (err, r, gt, lt) {
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
    mysql2.findPage('select * from test_paging', 0, 0, 4, function (err, r, gt, lt) {
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
    mysql2.findPage('select * from test_paging', 0, 7, 4, function (err, r, gt, lt) {
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
    mysql2.findPage('select * from test_paging', 0, 3, 4, function (err, r, gt, lt) {
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
    mysql2.findPage('select * from test_paging', 2, 0, 4, function (err, r, gt, lt) {
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
    mysql2.findPage('select * from test_paging', 6, 0, 4, function (err, r, gt, lt) {
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
