var should = require('should');

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var mongo = require('../mongo/mongo')({ dropDatabase: true });
var express2 = require('../main/express');
var ufix = require('../user/user-fixture');

require('../user/user-auth-api');
require('../post/post-api');

before(function (done) {
  init.run(done);
});

before(function () {
  express.listen();
});

describe("listing threads", function () {
  var samples = [
    { cid: 100, writer: 'snowman', title: 'title 1', text: 'text 1' },
    { cid: 100, writer: 'snowman', title: 'title 2', text: 'text 2' },
    { cid: 100, writer: 'snowman', title: 'title 3', text: 'text 3' },
    { cid: 100, writer: 'snowman', title: 'title 4', text: 'text 4' },
    { cid: 300, writer: 'snowman', title: 'title 5', text: 'text 5' },
    { cid: 300, writer: 'snowman', title: 'title 6', text: 'text 6' },
    { cid: 400, writer: 'snowman', title: 'title 7', text: 'text 7' }
  ];

  it("given logged out", function (done) {
    ufix.logout(done);
  });
  it("should fail", function (done) {
    express.post('/api/threads', function (err, res) {
      res.error.should.false;
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  it("given sample threads", function (done) {
    var i = 0;
    var len = samples.length;
    (function insert() {
      if (i == len) return done();
      var item = samples[i++];
      express.post('/api/threads').send(item).end(function (err, res) {
        res.error.should.false;
        setImmediate(insert);
      });
    })();
  });
  it("should success when no op", function (done) {
    express.get('/api/threads', function (err, res) {
      should.not.exist(res.body.err);
      res.body.threads.should.length(7);

      var t;
      t = res.body.threads[0];
      t.should.have.property('_id');
      t.category.id.should.equal(400);
      t.writer.should.equal('snowman');
      t.title.should.equal('title 7');
      t.hit.should.equal(0);
      t.length.should.equal(1);

      t = res.body.threads[6];
      t.should.have.property('_id');
      t.category.id.should.equal(100);
      t.writer.should.equal('snowman');
      t.title.should.equal('title 1');
      done();
    });
  });
  it("should success with category 0", function (done) {
    express.get('/api/threads').query({ c: 0 }).end(function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.threads.should.length(7);
      done();
    });
  });
  it("should success with category 300", function (done) {
    express.get('/api/threads').query({ c: 300 }).end(function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.threads.should.length(2);
      done();
    });
  });
  it("should success with page 2", function (done) {
    express.get('/api/threads').query({ c: 0, pg: 2, ps: 3 }).end(function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.threads.should.length(3);
      res.body.threads[0].title.should.equal('title 4');
      res.body.threads[1].title.should.equal('title 3');
      res.body.threads[2].title.should.equal('title 2');
      done();
    });
  });
  describe("last", function () {
    it("should be false with page 1", function (done) {
      express.get('/api/threads').query({ c: 0, pg: 1, ps: 3 }).end(function (err, res) {
        res.error.should.false;
        should.not.exist(res.body.err);
        res.body.last.should.false;
        done();
      });
    });
    it("should be false with page 2", function (done) {
      express.get('/api/threads').query({ c: 0, pg: 2, ps: 3 }).end(function (err, res) {
        res.error.should.false;
        should.not.exist(res.body.err);
        res.body.last.should.false;
        done();
      });
    });
    it("should be false with page 3", function (done) {
      express.get('/api/threads').query({ c: 0, pg: 3, ps: 3 }).end(function (err, res) {
        res.error.should.false;
        should.not.exist(res.body.err);
        res.body.last.should.true;
        done();
      });
    });
    it("should be false with page 4", function (done) {
      express.get('/api/threads').query({ c: 0, pg: 4, ps: 3 }).end(function (err, res) {
        res.error.should.false;
        should.not.exist(res.body.err);
        res.body.last.should.true;
        done();
      });
    });
  });
});
