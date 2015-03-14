var should = require('should');

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var mongo = require('../mongo/mongo')({ dropDatabase: true });
var express = require('../main/express');
var ufix = require('../user/user-fixture');

require('../user/user-auth-api');
require('../post/post-api');

before(function (done) {
  init.run(done);
});

before(function () {
  express.listen();
});

describe("creating post/replay", function () {
  it("given logged out", function (done) {
    ufix.logout(done);
  });
  it("should fail", function (done) {
    express.post('/api/threads/0', function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  var tid1;
  it("given tid1", function (done) {
    var form = { cid: 101, writer: 'snowman', title: 'title 1', text: 'text' };
    express.post('/api/threads').send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      tid1 = res.body.tid;
      done();
    });
  });
  it("should fail with tid 99999", function (done) {
    var form = { writer: 'snowman', text: 'text' };
    express.post('/api/threads/99999').send(form).end(function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.INVALID_THREAD);
      done();
    });
  });
  it("should fail with tid xxx", function (done) {
    var form = { writer: 'snowman', text: 'text' };
    express.post('/api/threads/xxx').send(form).end(function (err, res) {
      res.status.should.equal(404);
      done();
    });
  });
  it("should fail with writer empty", function (done) {
    var form = { writer: ' ', text: 'text' };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.ERROR_SET);
      res.body.err.errors.some(function (field) {
        return field.name === 'writer' && field.msg === error.msg.FILL_WRITER;
      }).should.true;
      done();
    });
  });
  it("should success", function (done) {
    var form = { writer: 'snowman', text: 'text' };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.body.err);
      res.body.should.have.property('pid');
      done();
    });
  });
});

describe("creating post/replay in recycle bin", function () {
  it("given admin session", function (done) {
    ufix.loginAdmin(done);
  });
  var tid1;
  it("given tid2", function (done) {
    var form = { cid: 40, writer: 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' };
    express.post('/api/threads').send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      tid1 = res.body.tid;
      done();
    });
  });
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  it("should fail", function (done) {
    var form = { writer: 'snowman', text: 'text' };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.INVALID_CATEGORY);
      done();
    });
  });
  it("given admin session", function (done) {
    ufix.loginAdmin(done);
  });
  it("should success", function (done) {
    var form = { writer: 'snowman', text: 'text' };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      done();
    });
  });
});