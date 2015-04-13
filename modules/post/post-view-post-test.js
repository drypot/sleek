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

describe('reading post', function () {
  it('given user session', function (done) {
    userf.login('user', done);
  });
  var tid1, pid1, pid2;
  it('given tid1, pid1', function (done) {
    var form = { cid: 101, writer: 'snowman1', title: 'title1', text: 'post11' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      tid1 = res.body.tid;
      pid1 = res.body.pid;
      done();
    });
  });
  it('given pid2', function (done) {
    var form = { writer: 'snowman1', text: 'post12' };
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      pid2 = res.body.pid;
      done();
    });
  });
  it('given admin session', function (done) {
    userf.login('admin', done);
  });
  var tid2, pid3, pid4;
  it('given tid2, pid3 in recycle bin', function (done) {
    var form = { cid: 40, writer: 'snowman2', title: 'title2', text: 'post21' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      tid2 = res.body.tid;
      pid3 = res.body.pid;
      done();
    });
  });
  it('given pid4 in recycle bin', function (done) {
    var form = { writer: 'snowman2', text: 'post22' };
    local.post('/api/threads/' + tid2).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      pid4 = res.body.pid;
      done();
    });
  });
  it('given logged out', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it('given user session', function (done) {
    userf.login('user', done);
  });
  it('should fail with invalid tid', function (done) {
    local.get('/api/threads/' + 99999 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.INVALID_THREAD);
      done();
    });
  });
  it('should fail with mismatching tid', function (done) {
    local.get('/api/threads/' + tid2 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.INVALID_POST);
      done();
    });
  });
  it('should fail with invalid pid', function (done) {
    local.get('/api/threads/' + tid1 + '/' + 99999, function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.INVALID_POST);
      done();
    });
  });
  it('should success for pid1', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      res.body.thread.title.should.equal('title1');
      res.body.category.id.should.equal(101);
      res.body.post.writer.should.equal('snowman1');
      res.body.post.text.should.equal('post11');
      res.body.post.head.should.true;
      res.body.post.visible.should.true;
      done();
    });
  });
  it('should success for pid2', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      res.body.post.writer.should.equal('snowman1');
      res.body.post.text.should.equal('post12');
      res.body.post.head.should.false;
      res.body.post.visible.should.true;
      done();
    });
  });
  it('given user session', function (done) {
    userf.login('user', done);
  });
  it('should fail for pid3 in recycle bin', function (done) {
    local.get('/api/threads/' + tid2 + '/' + pid3, function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.INVALID_CATEGORY);
      done();
    });
  });
  it('should fail for pid4 in recycle bin', function (done) {
    local.get('/api/threads/' + tid2 + '/' + pid4, function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.INVALID_CATEGORY);
      done();
    });
  });
  it('given admin session', function (done) {
    userf.login('admin', done);
  });
  it('should success for pid3 in recycle bin', function (done) {
    local.get('/api/threads/' + tid2 + '/' + pid3, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      res.body.thread.title.should.equal('title2');
      res.body.category.id.should.equal(40);
      res.body.post.writer.should.equal('snowman2');
      res.body.post.text.should.equal('post21');
      res.body.post.head.should.true;
      res.body.post.visible.should.true;
      done();
    });
  });
  it('should success for pid4 in recycle bin', function (done) {
    local.get('/api/threads/' + tid2 + '/' + pid4, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      res.body.post.writer.should.equal('snowman2');
      res.body.post.text.should.equal('post22');
      res.body.post.head.should.false;
      res.body.post.visible.should.true;
      done();
    });
  });
});

