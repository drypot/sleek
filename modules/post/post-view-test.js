var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongop = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../express/express');
var userf = require('../user/user-fixture');
var postc = require('../post/post-create');
var postv = require('../post/post-view');
var local = require('../express/local');
var expect = require('../base/assert').expect

before(function (done) {
  init.run(done);
});

describe('thread and posts', function () {
  var tid;
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given thread', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title', text: 'post1' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      tid = res.body.tid;
      done();
    });
  });
  it('given reply', function (done) {
    var form = { writer: 'snowman2', text: 'post2' };
    local.post('/api/posts/' + tid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('given invisible reply', function (done) {
    var form = { writer: 'admin', text: 'post3', visible: false };
    local.post('/api/posts/' + tid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.get('/api/posts/0', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should return 2 posts', function (done) {
    local.get('/api/posts/' + tid, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.posts).length(2);
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('should return 3 posts', function (done) {
    local.get('/api/posts/' + tid, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.posts).length(3);
      done();
    });
  });
});

describe('post editable', function () {
  var tid, pid;
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given thread', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title 1', text: 'post 1' };
      local.post('/api/posts').send(form).end(function (err, res) {
        expect(err).not.exist;
        expect(res.body.err).not.exist;
        tid = res.body.tid;
        pid = res.body.pid;
        done();
      }
    );
  });
  it('should be true', function (done) {
    local.get('/api/posts/' + tid, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.posts[0].editable).true;
      done();
    });
  });
  it('given new user session', function (done) {
    local.newAgent();
    userf.login('user', done);
  });
  it('should be false', function (done) {
    local.get('/api/posts/' + tid, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.posts[0].editable).false;
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('should be true', function (done) {
    local.get('/api/posts/' + tid, function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.posts[0].editable).true;
      done();
    });
  });
});

describe.only('redirects', function () {
  it('should success', function (done) {
    local.get('/post/10').redirects(0).end(function (err, res) {
      expect(err).exist;
      expect(res).status(302); // Moved Temporarily 
      expect(res).header('location', '/posts/10');
      done();
    });
  });
  it('should success', function (done) {
    local.get('/threads/10').redirects(0).end(function (err, res) {
      expect(err).exist;
      expect(res).status(302); // Moved Temporarily 
      expect(res).header('location', '/posts/10');
      done();
    });
  });
});
