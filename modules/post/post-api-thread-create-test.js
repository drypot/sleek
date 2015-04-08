var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-http'));
chai.config.includeStack = true;

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongo = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../main/express');
var userf = require('../user/user-fixture');

require('../user/user-auth-api');
require('../post/post-api');

before(function (done) {
  init.run(done);
});

before(function () {
  express.listen();
});

describe("creating thread", function () {
  it("given logged out", function (done) {
    userf.logout(done);
  });
  it("should fail", function (done) {
    local.post('/api/threads', function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it("given user session", function (done) {
    userf.login('user', done);
  });
  it("should fail when cid invalid", function (done) {
    var form = { cid: 10100, writer: 'snowman', title: 'title', text: 'text' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.INVALID_CATEGORY);
      done();
    });
  });
  it("should fail when title empty", function (done) {
    var form = { cid: 101, writer: 'snowman', title: ' ', text: 'text' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.ERROR_SET);
      res.body.err.errors.some(function (field) {
        return field.name === 'title' && field.msg === error.msg.FILL_TITLE;
      }).should.true;
      done();
    });
  });
  it("should fail when title big", function (done) {
    var bigTitle = 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title';
    var form = { cid: 101, writer: 'snowman', text: 'text', title: bigTitle };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.ERROR_SET);
      res.body.err.errors.some(function (field) {
        return field.name === 'title' && field.msg === error.msg.SHORTEN_TITLE;
      }).should.true;
      done();
    });
  });
  it("should fail when writer empty", function (done) {
    var form = { cid: 101, writer: ' ', title: 'title', text: 'text' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.ERROR_SET);
      res.body.err.errors.some(function (field) {
        return field.name === 'writer' && field.msg === error.msg.FILL_WRITER;
      }).should.true;
      done();
    });
  });
  it("should fail when writer big", function (done) {
    var form = { cid: 101, writer: '123456789012345678901234567890123', title: 'title', text: 'text' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.ERROR_SET);
      res.body.err.errors.some(function (field) {
        return field.name === 'writer' && field.msg === error.msg.SHORTEN_WRITER;
      }).should.true;;
      done();
    });
  });
  it("should success", function (done) {
    var form = { cid: 101, writer: 'snowman', title: 'title 1', text: 'post11' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.should.have.property('tid');
      res.body.should.have.property('pid');
      done();
    });
  });
});

describe("creating thread in recycle bin", function () {
  it("given user session", function (done) {
    userf.login('user', done);
  });
  it("should fail", function (done) {
    var form = { cid: 40, writer: 'snowman', title: 'title', text: 'text' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.INVALID_CATEGORY);
      done();
    });
  });
  it("given admin session", function (done) {
    userf.login('admin', done);
  });
  it("should success", function (done) {
    var form = { cid: 40, writer: 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      done();
    });
  });
});
