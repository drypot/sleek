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

describe("post.editable", function () {
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  var tid1, pid1, pid2;
  it("given tid1, pid1", function (done) {
    var form = { cid: 101, writer: 'snowman', title: 'title 1', text: 'post1' };
      express.post('/api/threads').send(form).end(function (err, res) {
        res.error.should.false;
        should.not.exist(res.body.err);
        tid1 = res.body.tid;
        pid1 = res.body.pid;
        done();
      }
    );
  });
  it("given pid2", function (done) {
    var form = { writer: 'snowman', text: 'post2' };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      pid2 = res.body.pid;
      done();
    });
  });
  it("should be true for pid1", function (done) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.post.editable.should.be.true;
      done();
    });
  });
  it("should be true for pid2", function (done) {
    express.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.post.editable.should.be.true;
      done();
    });
  });
  it("given new user session", function (done) {
    ufix.loginUser(done);
  });
  it("should be false for pid1", function (done) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.post.editable.should.be.false;
      done();
    });
  });
  it("should be false for pid2", function (done) {
    express.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.post.editable.should.be.false;
      done();
    });
  });
  it("given admin session", function (done) {
    ufix.loginAdmin(done);
  });
  it("should be true for pid1", function (done) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.post.editable.should.be.true;
      done();
    });
  });
  it("should be true for pid2", function (done) {
    express.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.post.editable.should.be.true;
      done();
    });
  });

});
