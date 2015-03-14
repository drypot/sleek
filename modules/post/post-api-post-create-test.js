var should = require('should');

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var mongo = require('../mongo/mongo')({ dropDatabase: true });
var express = require('../main/express');
var ufix = require('../user/user-fixture');

require('../user/user-auth-api');
require('../post/post-api');

before(function (next) {
  init.run(next);
});

before(function () {
  express.listen();
});

describe("creating post/replay", function () {
  it("given logged out", function (next) {
    ufix.logout(next);
  });
  it("should fail", function (next) {
    express.post('/api/threads/0', function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      next();
    });
  });
  it("given user session", function (next) {
    ufix.loginUser(next);
  });
  var tid1;
  it("given tid1", function (next) {
    var form = { cid: 101, writer: 'snowman', title: 'title 1', text: 'text' };
    express.post('/api/threads').send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      tid1 = res.body.tid;
      next();
    });
  });
  it("should fail with tid 99999", function (next) {
    var form = { writer: 'snowman', text: 'text' };
    express.post('/api/threads/99999').send(form).end(function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.INVALID_THREAD);
      next();
    });
  });
  it("should fail with tid xxx", function (next) {
    var form = { writer: 'snowman', text: 'text' };
    express.post('/api/threads/xxx').send(form).end(function (err, res) {
      res.status.should.equal(404);
      next();
    });
  });
  it("should fail with writer empty", function (next) {
    var form = { writer: ' ', text: 'text' };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.ERROR_SET);
      res.body.err.errors.some(function (field) {
        return field.name === 'writer' && field.msg === error.msg.FILL_WRITER;
      }).should.true;
      next();
    });
  });
  it("should success", function (next) {
    var form = { writer: 'snowman', text: 'text' };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.body.err);
      res.body.should.have.property('pid');
      next();
    });
  });
});

describe("creating post/replay in recycle bin", function () {
  it("given admin session", function (next) {
    ufix.loginAdmin(next);
  });
  var tid1;
  it("given tid2", function (next) {
    var form = { cid: 40, writer: 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' };
    express.post('/api/threads').send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      tid1 = res.body.tid;
      next();
    });
  });
  it("given user session", function (next) {
    ufix.loginUser(next);
  });
  it("should fail", function (next) {
    var form = { writer: 'snowman', text: 'text' };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.INVALID_CATEGORY);
      next();
    });
  });
  it("given admin session", function (next) {
    ufix.loginAdmin(next);
  });
  it("should success", function (next) {
    var form = { writer: 'snowman', text: 'text' };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      next();
    });
  });
});