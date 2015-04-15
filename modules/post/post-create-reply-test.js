var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongop = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var local = require('../express/local');
var expect = require('../base/assert').expect

require('../post/post-api');

before(function (done) {
  init.run(done);
});

describe('creating post/replay', function () {
  it('given logged out', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.post('/api/threads/0', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
  it('given user session', function (done) {
    userf.login('user', done);
  });
  var tid1;
  it('given tid1', function (done) {
    var form = { cid: 101, writer: 'snowman', title: 'title 1', text: 'text' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      tid1 = res.body.tid;
      done();
    });
  });
  it('should fail with tid 99999', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    local.post('/api/threads/99999').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('INVALID_THREAD');
      done();
    });
  });
  it('should fail with tid xxx', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    local.post('/api/threads/xxx').send(form).end(function (err, res) {
      res.status.should.equal(404);
      done();
    });
  });
  it('should fail with writer empty', function (done) {
    var form = { writer: ' ', text: 'text' };
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('ERROR_SET');
      res.body.err.errors.some(function (field) {
        return field.name === 'writer' && field.msg === error.FILL_WRITER;
      }).should.true;
      done();
    });
  });
  it('should success', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(res.body.err).not.exist;
      res.body.should.property('pid');
      done();
    });
  });
});

describe('creating post/replay in recycle bin', function () {
  it('given admin session', function (done) {
    userf.login('admin', done);
  });
  var tid1;
  it('given tid2', function (done) {
    var form = { cid: 40, writer: 'snowman', title: 'title in recycle bin', text: 'head text in recycle bin' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      tid1 = res.body.tid;
      done();
    });
  });
  it('given user session', function (done) {
    userf.login('user', done);
  });
  it('should fail', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('INVALID_CATEGORY');
      done();
    });
  });
  it('given admin session', function (done) {
    userf.login('admin', done);
  });
  it('should success', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
});