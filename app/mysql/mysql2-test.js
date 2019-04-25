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
