
import * as init from '../base/init.js';
import * as config from '../base/config.js';
import * as db from '../db/db.js';
import * as assert2 from "../base/assert2.js";

before(function (done) {
  config.setPath('config/test.json');
  db.setDropDatabase(true);
  init.run(done);
});

describe('db', function () {
  it('should exist.', function (done) {
    const query = 'show databases like ?';
    db.query(query, config.prop.mysqlDatabase, function (err, r) {
      assert2.ifError(err);
      assert2.ok(r.length);
      done();
    });
  });
});

describe('queryOne', (done) => {
  it('should succeed when result exists.', done => {
    db.queryOne('select * from (select 1 as id) dummy where id = 1', (err, r) => {
      assert2.ifError(err);
      assert2.ok(r.id === 1);
      done();
    });
  });
  it('should succeed when result does not exists.', done => {
    db.queryOne('select * from (select 1 as id) dummy where id = 2', (err, r) => {
      assert2.ifError(err);
      console.log(r);
      assert2.ok(r === undefined);
      done();
    });
  });
});

describe('tableExists', () => {
  before((done) => {
    db.query('create table test_exist(id int)', done);
  });
  it('should return false when table not exists.', done => {
    db.tableExists('test_exist_xxx', (err, exist) => {
      assert2.ifError(err);
      assert2.e(exist, false);
      done();
    });
  });
  it('should return true when table exists.', done => {
    db.tableExists('test_exist', (err, exist) => {
      assert2.ifError(err);
      assert2.e(exist, true);
      done();
    });
  });
});
