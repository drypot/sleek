'use strict';

const mongo = require('mongodb');

const init = require('../base/init');
const config = require('../base/config');
const async2 = require('../base/async2');
const assert = require('assert');
const assert2 = require('../base/assert2');
const mongo2 = exports;

mongo2.ObjectID = mongo.ObjectID;

// db

var client;

init.add(
  (done) => {
    assert2.ne(config.mongodb, undefined);
    mongo.MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true }, function (err, _client) {
      if (err) return done(err);
      client = _client;
      done();
    });
  },
  (done) => {
    if (mongo2.dropDatabase) {
      console.log('mongo: dropping db');
      client.db(config.mongodb).dropDatabase(done);
    } else {
      done();
    }
  },
  (done) => {
    console.log('mongo: db=' + config.mongodb);
    mongo2.db = client.db(config.mongodb);
    if (config.mongoUser) {
      mongo2.db.authenticate(config.mongoUser, config.mongoPassword, done);
    } else {
      done();
    }
  }
);

mongo2.close = function (done) {
  client.close(false, done);
};

// values

mongo2.values = {};

init.add((done) => {
  mongo2._values = mongo2.db.collection('values');
  done();
});

mongo2.values.find = function (id, done) {
  mongo2._values.findOne({ _id: id }, function (err, doc) {
    if (err) return done(err);
    done(null, doc ? doc.v : null);
  });
};

mongo2.values.update = function (id, value, done) {
  mongo2._values.updateOne({ _id: id }, { $set: { v: value } }, { upsert: true }, done);
};

// utilities

// _id 를 숫자로 쓰는 컬렉션만 페이징할 수 있다.

mongo2.findPage = function (col, query, opt, gt, lt, ps, filter, done) {
  let gtPage = !isNaN(gt);
  let ltPage = !gtPage && !isNaN(lt);
  if (gtPage) {
    query._id = { $gt: gt };
    opt.sort = { _id: 1 };
  } else {
    opt.sort = { _id: -1 };
    if (ltPage) {
      query._id = { $lt: lt };
    }
  }
  opt.limit = ps + 1;
  let cursor = col.find(query, opt);
  let results = [];
  let count = 0, first, last;
  (function read() {
    cursor.next(function (err, doc) {
      if (err) return done(err);
      let full = count == ps;
      if (!doc || full) {
        let more = full && !!doc;
        let rgt, rlt;
        if (gtPage) {
          rgt = more ? last : undefined;
          rlt = gt !== 0 ? first : undefined;
        } else if (ltPage) {
          rgt = first;
          rlt = more ? last : undefined;
        } else {
          rgt = undefined;
          rlt = more ? last : undefined;
        }
        done(null, results, rgt, rlt);
      } else {
        count++;
        if (!first) first = doc._id;
        last = doc._id;
        async2.waterfall(
          (done) => {
            if (filter) {
              filter(doc, done);
            } else {
              done(null, doc);
            }
          },
          (err, doc) => {
            if (err) return done(err);
            if (doc) {
              if (gtPage) {
                results.unshift(doc);
              } else {
                results.push(doc);
              }
            }
            setImmediate(read);
          }
        );
      }
    });
  })();
};

mongo2.findDeepDoc = function (col, query, opt, date, done) {
  query.cdate = { $lt : date };
  opt.sort = { cdate: -1 };
  opt.limit = 1;
  col.findOne(query, opt, function (err, ddoc) {
    if (err) return done(err);
    if (ddoc) {
      done(null, ddoc.cdate.getFullYear(), ddoc._id + 1);
    } else {
      done(null);
    }
  });
}

mongo2.forEach = function (col, doit, done) {
  var cursor = col.find();
  (function read() {
    cursor.next(function (err, obj) {
      if (err) return done(err);
      if (obj) {
        doit(obj, function (err) {
          if (err) return done(err);
          setImmediate(read);
        });
        return;
      }
      done();
    });
  })();
};

mongo2.getLastId = function (col, done) {
  var opt = { projection: { _id: 1 }, sort: { _id: -1 }, limit: 1 };
  col.find({}, opt).next(function (err, obj) {
    done(err, obj ? obj._id : 0);
  });
};
