var should = require('should');

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
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

describe("reading thread and posts", function () {
  it("given logged out", function (done) {
    ufix.logout(done);
  });
  it("should fail", function (done) {
    express.get('/api/threads/0', function (err, res) {
      res.error.should.false;
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  var tid;
  it("given thread", function (done) {
    var form = { cid: 101, writer: 'snowman', title: 'title', text: 'post1' };
    express.post('/api/threads').send(form).end(function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      tid = res.body.tid;
      done();
    });
  });
  it("given reply", function (done) {
    var form = { writer: 'snowman2', text: 'post2' };
    express.post('/api/threads/' + tid).send(form).end(function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      done();
    });
  });
  it("should return 2 posts", function (done) {
    express.get('/api/threads/' + tid, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.thread._id.should.equal(tid);
      res.body.thread.title.should.equal('title');
      res.body.category.id.should.equal(101);
      res.body.posts.should.length(2);
      res.body.posts[0].writer.should.equal('snowman');
      res.body.posts[0].text.should.equal('post1');
      res.body.posts[1].writer.should.equal('snowman2');
      res.body.posts[1].text.should.equal('post2');
      done();
    });
  });
  it("given another reply", function (done) {
    var form = { writer: 'snowman2', text: 'post3' };
    express.post('/api/threads/' + tid).send(form).end(function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      done();
    });
  });
  it("should return 3 posts", function (done) {
    express.get('/api/threads/' + tid, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.posts.should.length(3);
      done();
    });
  });
  it("given admin session", function (done) {
    ufix.loginAdmin(done);
  });
  it("given another invisible reply", function (done) {
    var form = { writer: 'admin', text: 'post4', visible: false };
    express.post('/api/threads/' + tid).send(form).end(function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      done();
    });
  });
  it("should return 4 posts", function (done) {
    express.get('/api/threads/' + tid, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.posts.should.length(4);
      done();
    });
  });
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  it("should return 3 posts", function (done) {
    express.get('/api/threads/' + tid, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.posts.should.length(3);
      done();
    });
  });
});
