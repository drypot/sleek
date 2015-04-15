var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongop = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var postb = require('../post/post-base');
var postc = require('../post/post-create');
var local = require('../express/local');
var expect = require('../base/assert').expect

before(function (done) {
  init.run(done);
});

describe('creating replay', function () {
  var tid;
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.post('/api/posts/0', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given thread', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title 1', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      tid = res.body.tid;
      done();
    });
  });
  it('should success', function (done) {
    var form = { writer: 'snowman 2', text: 'text 2' };
    local.post('/api/posts/' + tid).send(form).end(function (err, res) {
      expect(res.body.err).not.exist;
      expect(res.body).property('pid');
      postb.posts.findOne({ _id: res.body.pid }, function (err, post) {
        expect(err).not.exist;
        expect(post.tid).equals(tid);
        expect(post.cdate).exist;
        expect(post.visible).true;
        expect(post.writer).equals('snowman 2');
        expect(post.text).equals('text 2');
        expect(post.tokens).exist;
        done();
      });    
    });
  });
  it('thread 999 should fail', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    local.post('/api/posts/999').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('INVALID_THREAD');
      done();
    });
  });
  it('thread xxx should fail', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    local.post('/api/posts/xxx').send(form).end(function (err, res) {
      expect(err).exist;
      expect(res.status).equal(404);
      done();
    });
  });
  it('empty writer should fail', function (done) {
    var form = { writer: ' ', text: 'text' };
    local.post('/api/posts/' + tid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('WRITER_EMPTY');
      done();
    });
  });
});

describe('creating reply in recycle bin', function () {
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  var tid;
  it('given thread', function (done) {
    var form = { cid: 40, writer: 'snowman', title: 'in recycle bin', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      tid = res.body.tid;
      done();
    });
  });
  it('should success', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    local.post('/api/posts/' + tid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should fail', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    local.post('/api/posts/' + tid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('INVALID_CATEGORY');
      done();
    });
  });
});