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

describe('reading thread and posts', function () {
  it('given logged out', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.get('/api/threads/0', function (err, res) {
      expect(err).not.exist;
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it('given user session', function (done) {
    userf.login('user', done);
  });
  var tid;
  it('given thread', function (done) {
    var form = { cid: 101, writer: 'snowman', title: 'title', text: 'post1' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      tid = res.body.tid;
      done();
    });
  });
  it('given reply', function (done) {
    var form = { writer: 'snowman2', text: 'post2' };
    local.post('/api/threads/' + tid).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      done();
    });
  });
  it('should return 2 posts', function (done) {
    local.get('/api/threads/' + tid, function (err, res) {
      expect(err).not.exist;
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
  it('given another reply', function (done) {
    var form = { writer: 'snowman2', text: 'post3' };
    local.post('/api/threads/' + tid).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      done();
    });
  });
  it('should return 3 posts', function (done) {
    local.get('/api/threads/' + tid, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.posts.should.length(3);
      done();
    });
  });
  it('given admin session', function (done) {
    userf.login('admin', done);
  });
  it('given another invisible reply', function (done) {
    var form = { writer: 'admin', text: 'post4', visible: false };
    local.post('/api/threads/' + tid).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      done();
    });
  });
  it('should return 4 posts', function (done) {
    local.get('/api/threads/' + tid, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.posts.should.length(4);
      done();
    });
  });
  it('given user session', function (done) {
    userf.login('user', done);
  });
  it('should return 3 posts', function (done) {
    local.get('/api/threads/' + tid, function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.posts.should.length(3);
      done();
    });
  });
});
