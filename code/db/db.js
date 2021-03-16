import mysql from "mysql";
import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as config from '../base/config.js';
import * as async2 from "../base/async2.js";

let conn;

// 작업 종료후 pool을 닫으면 큐잉된 쿼리는 실행되지 못하고 'Pool is closed' 를 뿜는다.
// 이 문제가 해결되기 전까지 pool 사용을 피한다.

//var pool;

let dropDatabase = false;

export function setDropDatabase(b) {
  dropDatabase = b;
}

// 광역 typeCast 는 안 하기로 한다.
// JSON 이 JSON 으로 오지 않고 BLOB 으로 온다.
// 다른 정보가 BLOB 으로 오면 구분할 수가 없다.

init.add(
  (done) => {
    conn = mysql.createConnection({
      host: 'localhost',
      user: config.prop.mysqlUser,
      password: config.prop.mysqlPassword,
      charset: 'utf8mb4',
      multipleStatements: true,
      //typeCast: typeCast,
    });
    done();
  },
  (done) => {
    if (dropDatabase) {
      console.log('mysql: dropping db, ' + config.prop.mysqlDatabase);
      conn.query('drop database if exists ??', config.prop.mysqlDatabase, done);
    } else {
      done();
    }
  },
  (done) => {
    console.log('mysql: db=' + config.prop.mysqlDatabase);
    conn.query('create database if not exists ?? character set utf8mb4', config.prop.mysqlDatabase, done);
  },
  (done) => {
    conn.changeUser({ database: config.prop.mysqlDatabase }, done);
  },
  // (done) => {
  //   db.pool = pool = mysql.createPool({
  //     connectionLimit: 10,
  //     host: 'localhost',
  //     database: config.prop.mysqlDatabase,
  //     user: config.prop.mysqlUser,
  //     password: config.prop.mysqlPassword,
  //     charset: 'utf8mb4',
  //     multipleStatements: true,
  //   });
  //   done();
  // }
);

export function close(done) {
  async2.waterfall(
    (done) => {
      if (conn) {
        conn.end(done);
      } else {
        done();
      }
    },
    // (done) => {
    //   if (pool) {
    //     pool.end(done);
    //   } else {
    //     done();
    //   }
    // },
    done
  );
}

// utilities

export function query() {
  //pool.query.apply(pool, arguments);
  conn.query.apply(conn, arguments);
}

export function queryOne(sql, param, done) {
  if (!done) {
    done = param;
    param = null;
  }
  //pool.query(sql, param, (err, r, f) => {
  conn.query(sql, param, (err, r, f) => {
    if (err) return done(err);
    done(null, r[0], f);
  });
}

export function getMaxId(table, done) {
  queryOne('select coalesce(max(id), 0) as maxId from ??', table, (err, r) => {
    if (err) return done(err);
    done(null, r.maxId);
  });
}

export function tableExists(name, done) {
  query('show tables like ?', name, (err, r) => {
    if (err) return done(err);
    done(null, !!r.length);
  });
}
