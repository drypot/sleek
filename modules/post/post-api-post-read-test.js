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

describe("reading post", function () {
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  var tid1, pid1, pid2;
  it("given tid1, pid1", function (done) {
    var form = { cid: 101, writer: 'snowman1', title: 'title1', text: 'post11' };
    express.post('/api/threads').send(form).end(function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      tid1 = res.body.tid;
      pid1 = res.body.pid;
      done();
    });
  });
  it("given pid2", function (done) {
    var form = { writer: 'snowman1', text: 'post12' };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      pid2 = res.body.pid;
      done();
    });
  });
  it("given admin session", function (done) {
    ufix.loginAdmin(done);
  });
  var tid2, pid3, pid4;
  it("given tid2, pid3 in recycle bin", function (done) {
    var form = { cid: 40, writer: 'snowman2', title: 'title2', text: 'post21' };
    express.post('/api/threads').send(form).end(function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      tid2 = res.body.tid;
      pid3 = res.body.pid;
      done();
    });
  });
  it("given pid4 in recycle bin", function (done) {
    var form = { writer: 'snowman2', text: 'post22' };
    express.post('/api/threads/' + tid2).send(form).end(function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      pid4 = res.body.pid;
      done();
    });
  });
  it("given logged out", function (done) {
    ufix.logout(done);
  });
  it("should fail", function (done) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      res.error.should.false;
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  it("should fail with invalid tid", function (done) {
    express.get('/api/threads/' + 99999 + '/' + pid1, function (err, res) {
      res.error.should.false;
      res.body.err.rc.should.equal(error.INVALID_THREAD);
      done();
    });
  });
  it("should fail with mismatching tid", function (done) {
    express.get('/api/threads/' + tid2 + '/' + pid1, function (err, res) {
      res.error.should.false;
      res.body.err.rc.should.equal(error.INVALID_POST);
      done();
    });
  });
  it("should fail with invalid pid", function (done) {
    express.get('/api/threads/' + tid1 + '/' + 99999, function (err, res) {
      res.error.should.false;
      res.body.err.rc.should.equal(error.INVALID_POST);
      done();
    });
  });
  it("should success for pid1", function (done) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.thread.title.should.equal('title1');
      res.body.category.id.should.equal(101);
      res.body.post.writer.should.equal('snowman1');
      res.body.post.text.should.equal('post11');
      res.body.post.head.should.true;
      res.body.post.visible.should.true;
      done();
    });
  });
  it("should success for pid2", function (done) {
    express.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.post.writer.should.equal('snowman1');
      res.body.post.text.should.equal('post12');
      res.body.post.head.should.false;
      res.body.post.visible.should.true;
      done();
    });
  });
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  it("should fail for pid3 in recycle bin", function (done) {
    express.get('/api/threads/' + tid2 + '/' + pid3, function (err, res) {
      res.error.should.false;
      res.body.err.rc.should.equal(error.INVALID_CATEGORY);
      done();
    });
  });
  it("should fail for pid4 in recycle bin", function (done) {
    express.get('/api/threads/' + tid2 + '/' + pid4, function (err, res) {
      res.error.should.false;
      res.body.err.rc.should.equal(error.INVALID_CATEGORY);
      done();
    });
  });
  it("given admin session", function (done) {
    ufix.loginAdmin(done);
  });
  it("should success for pid3 in recycle bin", function (done) {
    express.get('/api/threads/' + tid2 + '/' + pid3, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.thread.title.should.equal('title2');
      res.body.category.id.should.equal(40);
      res.body.post.writer.should.equal('snowman2');
      res.body.post.text.should.equal('post21');
      res.body.post.head.should.true;
      res.body.post.visible.should.true;
      done();
    });
  });
  it("should success for pid4 in recycle bin", function (done) {
    express.get('/api/threads/' + tid2 + '/' + pid4, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.post.writer.should.equal('snowman2');
      res.body.post.text.should.equal('post22');
      res.body.post.head.should.false;
      res.body.post.visible.should.true;
      done();
    });
  });
});

