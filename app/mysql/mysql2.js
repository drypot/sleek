'use strict';

const mysql = require('mysql');

const init = require('../base/init');
const config = require('../base/config');
const mysql2 = exports;

// db

var conn;
var pool;

init.add((done) => {
  conn = mysql.createConnection({
    host     : 'localhost',
    user     : config.mysqlUser,
    password : config.mysqlPassword,
  });
  done();
});

init.add((done) => {
  if (mysql2.dropDatabase) {
    console.log('mysql: dropping db, ' + config.mysqlDatabase);
    conn.query('drop database if exists ??', config.mysqlDatabase, done);
  } else {
    done();
  }
});

init.add(function (done) {
  console.log('mysql: db=' + config.mysqlDatabase);
  conn.query('create database if not exists ?? character set utf8mb4', config.mysqlDatabase, (err) => {
    if (err) return done(err);
    pool = mysql.createPool({
      connectionLimit : 10,
      host     : 'localhost',
      database : config.mysqlDatabase,
      user     : config.mysqlUser,
      password : config.mysqlPassword,
      charset  : 'utf8mb4',
      multipleStatements: true,
    });
    done();
  });  
});

// utilities

mysql2.query = function () {
  pool.query.apply(pool, arguments);
};

mysql2.queryOne = function (sql, param, done) {
  if (!done) {
    done = param;
    param = null;
  }
  pool.query(sql, param, (err, r) => {
    done(err, r[0]);    
  });
};

mysql2.getMaxId = function (table, done) {
  mysql2.queryOne('select coalesce(max(id), 0) as maxId from ??', table, (err, r) => {
    if (err) return done(err);
    done(null, r.maxId);
  });
};

mysql2.tableExists = function (name, done) {
  mysql2.query('show tables like ?', name, (err, r) => {
    if (err) return done(err);
    done(null, !!r.length);
  });
};
