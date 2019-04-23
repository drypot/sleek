'use strict';

const mysql = require('mysql');

const init = require('../base/init');
const config = require('../base/config');
const mysql2 = exports;

// db

var conn;

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
    mysql2.pool = mysql.createPool({
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

mysql2.tableExists = function (name, done) {
  mysql2.pool.query('show tables like ?', name, (err, r) => {
    if (err) return done(err);
    done(null, !!r.length);
  });
};

// id 를 숫자로 쓰는 컬렉션만 페이징할 수 있다.
mysql2.findPage = function (sql, up, down, ps, done) {
  var where;
  if (down) {
    where = ' where id < ' + down + ' order by id desc limit ' + (ps + 1);
  } else if (up) {
    where = ' where id > ' + up + ' order by id asc limit ' + (ps + 1);
  } else {
    where = ' order by id desc limit ' + (ps + 1);
  }
  mysql2.pool.query(sql + where, function (err, r) {
    if (err) return done(err);
    var more = false;
    var first = 0;
    var last = 0;
    if (r.length > ps) {
      more = true;
      r.length = ps;
    }
    if (up) {
      r = r.reverse();
      first = more ? r[0].id : 0;
      last = r.length ? r[r.length-1].id : 0;
    } else if (down) {
      first = r.length ? r[0].id : 0;
      last = more ? r[r.length-1].id : 0;
    } else {
      first = 0;
      last = more ? r[r.length-1].id : 0;
    }
    done(null, r, first, last);
  });
};
