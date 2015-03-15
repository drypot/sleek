var should = require('should');

var init = require('../base/init');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var mongo = require('../mongo/mongo')({ dropDatabase: true });

before(function (done) {
  init.run(done);
});

describe("db", function () {
  it("should have databaseName", function () {
    mongo.db.databaseName.should.equal(config.mongoDb);
  });
});

describe("empty post collection", function () {
  it("should exist", function () {
    should.exist(mongo.posts);
  });
  it("should be empty", function (done) {
    mongo.posts.count(function (err, count) {
      should.not.exist(err);
      count.should.equal(0);
      done();
    })
  });
  it("should have three indexes", function (done) {
    mongo.posts.indexes(function (err, index) {
      should.not.exist(err);
      index.should.be.instanceof(Array);
      index.should.be.length(3);
      done();
    });
  });
  it("can make serialized ids", function () {
    var id1 = mongo.getNewPostId();
    var id2 = mongo.getNewPostId();
    (id1 < id2).should.true;
  });
});

describe("post collection", function () {

  describe("inserting", function () {
    it("should success", function (done) {
      var p = {
        tid: 1000, cdate: new Date(50), visible: true,
        writer: 'snowman', text: 'text'
      }
      mongo.insertPost(p, function (err) {
        should.not.exists(err);
        mongo.posts.count(function (err, count) {
          should.not.exist(err);
          count.should.equal(1);
          done();
        });
      });
    });
  });

  describe("finding by id", function () {
    var p = {
      tid: 1000, cdate: new Date(50), visible: true,
      writer: 'snowman', text: 'text'
    }
    it("given empty collection", function (done) {
      mongo.posts.remove(done);
    });
    it("given p", function (done) {
      p._id = mongo.getNewPostId();
      mongo.insertPost(p, done);
    });
    it("should success", function (done) {
      mongo.findPost(p._id, function (err, post) {
        should.not.exist(err);
        post.should.eql(p);
        done();
      });
    });
  });

  describe("finding by thread", function () {
    it("given empty collection", function (done) {
      mongo.posts.remove(done);
    });
    it("given posts", function (done) {
      var rows = [
        {
          _id: mongo.getNewPostId(), tid: 1000, cdate: new Date(10), visible: true,
          writer: 'snowman', text: 'cool post 11'
        },
        {
          _id: mongo.getNewPostId(), tid: 1000, cdate: new Date(20), visible: true,
          writer: 'snowman', text: 'cool post 12'
        },
        {
          _id: mongo.getNewPostId(), tid: 1000, cdate: new Date(30), visible: false,
          writer: 'snowman', text: 'cool post 13'
        },
        {
          _id: mongo.getNewPostId(), tid: 1010, cdate: new Date(10), visible: true,
          writer: 'snowman', text: 'cool post 21'
        },
        {
          _id: mongo.getNewPostId(), tid: 1010, cdate: new Date(20), visible: true,
          writer: 'snowman', text: 'cool post 22'
        }
      ];
      mongo.insertPost(rows, done);
    });
    it("should success", function (done) {
      var count = 0;
      var cursor = mongo.findPostsByThread(1000);
      function read() {
        cursor.nextObject(function (err, post) {
          should.not.exist(err);
          if (post) {
            count++;
            setImmediate(read);
            return;
          }
          count.should.equal(3);
          done();
        });
      }
      read();
    });
    it("should success", function (done) {
      var count = 0;
      var cursor = mongo.findPostsByThread(1010);
      function read() {
        cursor.nextObject(function (err, post) {
          should.not.exist(err);
          if (post) {
            count++;
            setImmediate(read);
            return;
          }
          count.should.equal(2);
          done();
        });
      }
      read();
    });
    it("should return sorted", function (done) {
      var posts = [];
      var cursor = mongo.findPostsByThread(1000);
      function read() {
        cursor.nextObject(function (err, post) {
          should.not.exist(err);
          if (post) {
            posts.push(post);
            setImmediate(read);
            return;
          }
          posts[0].cdate.should.below(posts[1].cdate);
          posts[1].cdate.should.below(posts[2].cdate);
          done();
        });
      }
      read();
    });
  });

  describe("updating", function () {
    var p = {
      tid: 1030, cdate: new Date(50), visible: true,
      writer: 'snowman', text: 'text'
    }
    it("given empty collection", function (done) {
      mongo.posts.remove(done);
    });
    it("given p", function (done) {
      p._id = mongo.getNewPostId();
      mongo.insertPost(p, done);
    });
    it("should success", function (done) {
      p.writer  = "fireman";
      p.hit = 17;
      mongo.updatePost(p, function (err) {
        should.not.exist(err);
        mongo.findPost(p._id, function (err, post) {
          should.not.exist(err);
          post.should.eql(p);
          done();
        });
      });
    });
  });
});