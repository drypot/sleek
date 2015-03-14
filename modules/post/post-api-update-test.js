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

describe("updating", function () {
  var tid1, pid1;
  it("given logged out", function (next) {
    ufix.logout(next);
  });
  it("should fail", function (next) {
    express.put('/api/threads/0/0', function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      next();
    });
  });
  it("given user session", function (next) {
    ufix.loginUser(next);
  });
  it("given p11", function (next) {
    var form = { cid: 101, writer: 'snowman', title: 'title', text: 'text' };
    express.post('/api/threads').send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      tid1 = res.body.tid;
      pid1 = res.body.pid;
      next();
    });
  });
  it("should fail when title empty", function (next) {
    var form = { cid: 101, writer: 'snowman', title: ' ', text: 'text', visible: true };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.ERROR_SET);
      res.body.err.errors.some(function (field) {
        return field.name === 'title' && field.msg === error.msg.FILL_TITLE;
      }).should.true;
      next();
    });
  });
  it("should fail when writer empty", function (next) {
    var form = { cid: 101, writer: ' ', title: 'title', text: 'text', visible: true };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.ERROR_SET);
      res.body.err.errors.some(function (field) {
        return field.name === 'writer' && field.msg === error.msg.FILL_WRITER;
      }).should.true;
      next();
    });
  });
  it("should success when category not changed", function (next) {
    var form = { cid: 101, writer: 'snowman1', title: 'title1', text: 'text1' };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      next();
    });
  });
  it("can be confirmed", function (next) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      should(!res.error);
      should(!res.body.err);
      res.body.post.head.should.true;
      res.body.category.id.should.equal(101);
      res.body.post.writer.should.equal('snowman1');
      res.body.thread.title.should.equal('title1');
      res.body.post.text.should.equal('text1');
      res.body.post.visible.should.true;
      next();
    });
  });
  it("should success when category changed", function (next) {
    var form = { cid: 102, writer: 'snowman2', title: 'title2', text: 'text2' };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      next();
    });
  });
  it("can be confirmed", function (next) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      should(!res.error);
      should(!res.body.err);
      res.body.category.id.should.equal(102);
      next();
    });
  });
  it("should success but can not change visible", function (next) {
    var form = { cid: 102, writer: 'snowman3', title: 'title3', text: 'text3', visible: false };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      next();
    });
  });
  it("can be confirmed", function (next) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      should(!res.error);
      should(!res.body.err);
      res.body.post.visible.should.true;
      next();
    });
  });
  it("given new user session", function (next) {
    ufix.loginUser(next);
  });
  it("should fail after reloged", function (next) {
    var form = { cid: 102, writer: 'snowman3', title: 'title3', text: 'text3', visible: false };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      should(!res.error);
      should(res.body.err);
      res.body.err.rc.should.equal(error.NOT_AUTHORIZED);
      next();
    });
  });
  it("given admin session", function (next) {
    ufix.loginAdmin(next);
  });
  it("should success and can change visible", function (next) {
    var form = { cid: 102, writer: 'snowman4', title: 'title4', text: 'text4', visible: false };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      next();
    });
  });
  it("can be confirmed", function (next) {
    express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      should(!res.error);
      should(!res.body.err);
      res.body.post.visible.should.false;
      next();
    });
  });
});

describe("updating reply", function () {
  var tid1, pid1, pid2;
  it("given user session", function (next) {
    ufix.loginUser(next);
  });
  it("given pid1", function (next) {
    var form = { cid: 101, writer: 'snowman', title: 'title', text: 'text' };
    express.post('/api/threads').send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      tid1 = res.body.tid;
      pid1 = res.body.pid;
      next();
    });
  });
  it("given pid2", function (next) {
    var form = { writer: 'snowman', text: 'text' };
    express.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      pid2 = res.body.pid;
      next();
    });
  });
  it("should success except visible field", function (next) {
    var form = { writer: 'snowman1', text: 'text1', visible: false };
    express.put('/api/threads/' + tid1 + '/' + pid2).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      next();
    });
  });
  it("can be confirmed", function (next) {
    express.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
      should(!res.error);
      should(!res.body.err);
      res.body.post.head.should.false;
      res.body.post.writer.should.equal('snowman1');
      res.body.post.text.should.equal('text1');
      res.body.post.visible.should.true;
      next();
    });
  });
});

describe("updating recycle bin", function () {
  var tid1, pid1;
  it("given admin session", function (next) {
    ufix.loginAdmin(next);
  });
  it("given p11 in recyle bin", function (next) {
    var form = { cid: 40, writer: 'snowman', title: 'title', text: 'text' };
    express.post('/api/threads').send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      tid1 = res.body.tid;
      pid1 = res.body.pid;
      next();
    });
  });
  it("should success", function (next) {
    var form = { cid: 40, writer: 'snowman1', title: 'title1', text: 'text1' };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      should(!res.error);
      should(!res.body.err);
      next();
    });
  });
  it("given user session", function (next) {
    ufix.loginUser(next);
  });
  it("should fail", function (next) {
    var form = { cid: 40, writer: 'snowman1', title: 'title1', text: 'text1' };
    express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.INVALID_CATEGORY);
      next();
    });
  });
});
