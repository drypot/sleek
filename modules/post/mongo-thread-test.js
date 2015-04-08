var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-http'));
chai.config.includeStack = true;

var init = require('../base/init');
var config = require('../base/config')({ path: 'config/test.json' });
var mongo = require('../mongo/mongo')({ dropDatabase: true });

before(function (done) {
  init.run(done);
});

describe("db", function () {
  it("should have databaseName", function () {
    mongo.db.databaseName.should.equal(config.mongoDb);
  });
});

describe("empty thread collection", function () {
  it("should exist", function () {
    should.exist(mongo.threads);
  });
  it("should be empty", function (done) {
    mongo.threads.count(function (err, count) {
      should.not.exist(err);
      count.should.equal(0);
      done();
    })
  });
  it("should have three index", function (done) {
    mongo.threads.indexes(function (err, indexes) {
      should.not.exist(err);
      indexes.should.be.instanceof(Array);
      indexes.should.be.length(3);
      done();
    });
  });
  it("can make serialized ids", function () {
    var id1 = mongo.getNewThreadId();
    var id2 = mongo.getNewThreadId();
    (id1 < id2).should.true;
  });
});

describe("thread collection", function () {

  describe("inserting", function () {
    it("should success", function (done) {
      var t = {
        cid: 100, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
        writer: 'snowman', title: 'title'
      };
      mongo.insertThread(t, function (err) {
        should.not.exists(err);
        mongo.threads.count(function (err, count) {
          should.not.exist(err);
          count.should.equal(1);
          done();
        });
      });
    });
  });

  describe("finding by id", function () {
    var t = {
      cid: 100, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
      writer: 'snowman', title: 'title'
    };
    it("given empty collection", function (done) {
      mongo.threads.remove(done);
    });
    it("given thread", function (done) {
      t._id = mongo.getNewThreadId();
      mongo.insertThread(t, done);
    });
    it("should success", function (done) {
      mongo.findThread(t._id, function (err, _t) {
        should.not.exist(err);
        _t.should.eql(t);
        done();
      });
    });
  });

  describe("finding by category", function () {
    it("given empty collection", function (done) {
      mongo.threads.remove(done);
    });
    it("given threads", function (done) {
      var rows = [
        {
          _id: mongo.getNewThreadId(), cid: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
          writer: 'snowman', title: 'title1'
        },
        {
          _id: mongo.getNewThreadId(), cid: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(20),
          writer: 'snowman', title: 'title2'
        },
        {
          _id: mongo.getNewThreadId(), cid: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(30),
          writer: 'snowman', title: 'title3'
        },
        {
          _id: mongo.getNewThreadId(), cid: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(40),
          writer: 'snowman', title: 'title4'
        },
        {
          _id: mongo.getNewThreadId(), cid: 103, hit: 10, length: 5, cdate: new Date(10), udate: new Date(50),
          writer: 'snowman', title: 'title5'
        },
        {
          _id: mongo.getNewThreadId(), cid: 103, hit: 10, length: 5, cdate: new Date(10), udate: new Date(60),
          writer: 'snowman', title: 'title6'
        },
        {
          _id: mongo.getNewThreadId(), cid: 104, hit: 10, length: 5, cdate: new Date(10), udate: new Date(70),
          writer: 'snowman', title: 'title7'
        },
        {
          _id: mongo.getNewThreadId(), cid: 104, hit: 10, length: 5, cdate: new Date(10), udate: new Date(80),
          writer: 'snowman', title: 'title8'
        },
        {
          _id: mongo.getNewThreadId(), cid: 104, hit: 10, length: 5, cdate: new Date(10), udate: new Date(90),
          writer: 'snowman', title: 'title9'
        },
        {
          _id: mongo.getNewThreadId(), cid: 104, hit: 10, length: 5, cdate: new Date(10), udate: new Date(100),
          writer: 'snowman', title: 'title10'
        }
      ];
      mongo.insertThread(rows, done);
    });
    it("should success with cid 0", function (done) {
      var threads = [];
      var cursor = mongo.findThreads(1, 99);
      function read() {
        cursor.nextObject(function (err, t) {
          should.not.exist(err);
          if (t) {
            threads.push(t);
            setImmediate(read);
            return;
          }
          threads.should.length(10);
          threads[0].title.should.equal('title10');
          threads[1].title.should.equal('title9');
          threads[2].title.should.equal('title8');
          threads[9].title.should.equal('title1');
          done();
        });
      }
      read();
    });
    it("should success when cid is 101", function (done) {
      var threads = [];
      var cursor = mongo.findThreadsByCategory(101, 1, 99);
      function read() {
        cursor.nextObject(function (err, t) {
          should.not.exist(err);
          if (t) {
            threads.push(t);
            setImmediate(read);
            return;
          }
          threads.should.length(4);
          done();
        });
      }
      read();
    });
    it("should success when page is 2", function (done) {
      var threads = [];
      var cursor = mongo.findThreads(2, 3);
      function read() {
        cursor.nextObject(function (err, t) {
          should.not.exist(err);
          if (t) {
            threads.push(t);
            setImmediate(read);
            return;
          }
          threads.should.length(3);
          threads[0].title.should.equal('title7');
          threads[1].title.should.equal('title6');
          threads[2].title.should.equal('title5');
          done();
        });
      }
      read();
    });
  });

  describe("updating", function () {
    var t = {
      cid: 100, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
      writer: 'snowman', title: 'title'
    };
    it("given empty collection", function (done) {
      mongo.threads.remove(done);
    });
    it("given thread", function (done) {
      t._id = mongo.getNewThreadId();
      mongo.insertThread(t, done);
    });
    it("should success", function (done) {
      t.writer  = 'oejfivoxkd';
      t.title = 'jfioejfasjdfiosjie'
      t.hit = 29384;
      mongo.updateThread(t, function (err) {
        should.not.exist(err);
        mongo.findThread(t._id, function (err, thread) {
          should.not.exist(err);
          thread.should.eql(t);
          done();
        });
      });
    });
  });

  describe("increasing hit", function () {
    var t = {
      cid: 100, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
      writer: 'snowman', title: 'title'
    };
    it("given empty collection", function (done) {
      mongo.threads.remove(done);
    });
    it("given thread", function (done) {
      t._id = mongo.getNewThreadId();
      mongo.insertThread(t, done);
    });
    it("should success", function (done) {
      mongo.updateThreadHit(t._id, function (err) {
        should.not.exist(err);
        mongo.findThread(t._id, function (err, thread) {
          should.not.exist(err);
          thread.hit.should.equal(11);
          done();
        });
      });
    });
  });

  describe("updating lenth & udate", function () {
    var t = {
      cid: 100, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
      writer: 'snowman', title: 'title'
    };
    it("given empty collection", function (done) {
      mongo.threads.remove(done);
    });
    it("given thread", function (done) {
      t._id = mongo.getNewThreadId();
      mongo.insertThread(t, done);
    });
    it("should success", function (done) {
      var now = new Date();
      mongo.updateThreadLength(t._id, now, function (err) {
        should.not.exist(err);
        mongo.findThread(t._id, function (err, thread) {
          should.not.exist(err);
          t.udate = now;
          t.length = 6;
          thread.should.eql(t);
          done();
        });
      });
    });
  });

});