var expect = require('../base/chai').expect;

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongop = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var local = require('../express/local');

require('../post/post-api');

before(function (done) {
  init.run(done);
});

describe('post.editable', function () {
  it('given user session', function (done) {
    userf.login('user', done);
  });
  var tid1, pid1, pid2;
  it('given tid1, pid1', function (done) {
    var form = { cid: 101, writer: 'snowman', title: 'title 1', text: 'post1' };
      local.post('/api/threads').send(form).end(function (err, res) {
        expect(err).not.exist;
        should.not.exist(res.body.err);
        tid1 = res.body.tid;
        pid1 = res.body.pid;
        done();
      }
    );
  });
  it('given pid2', function (done) {
    var form = { writer: 'snowman', text: 'post2' };
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      pid2 = res.body.pid;
      done();
    });
  });
  it('should be true for pid1', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.post.editable.should.be.true;
      done();
    });
  });
  it('should be true for pid2', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.post.editable.should.be.true;
      done();
    });
  });
  it('given new user session', function (done) {
    userf.login('user', done);
  });
  it('should be false for pid1', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.post.editable.should.be.false;
      done();
    });
  });
  it('should be false for pid2', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.post.editable.should.be.false;
      done();
    });
  });
  it('given admin session', function (done) {
    userf.login('admin', done);
  });
  it('should be true for pid1', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.post.editable.should.be.true;
      done();
    });
  });
  it('should be true for pid2', function (done) {
    local.get('/api/threads/' + tid1 + '/' + pid2, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.post.editable.should.be.true;
      done();
    });
  });

});
