'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const userf = require('../user/user-fixture');
const postn = require('../post/post-new');
const postv = require('../post/post-view');
const expl = require('../express/express-local');
const assert = require('assert');
const assert2 = require('../base/assert2');

before(function (done) {
  config.path = 'config/test.json';
  mysql2.dropDatabase = true;
  init.run(done);
});

before((done) => {
  expb.start();
  done();
});

describe('thread and posts', function () {
  var tid;
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given thread', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title', text: 'post1' };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      tid = res.body.tid;
      done();
    });
  });
  it('given reply', function (done) {
    var form = { writer: 'snowman2', text: 'post2' };
    expl.post('/api/posts/' + tid).send(form).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('given invisible reply', function (done) {
    var form = { writer: 'admin', text: 'post3', visible: false };
    expl.post('/api/posts/' + tid).send(form).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    expl.get('/api/posts/0', function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should return 2 posts', function (done) {
    expl.get('/api/posts/' + tid, function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.posts.length, 2);
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('should return 3 posts', function (done) {
    expl.get('/api/posts/' + tid, function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.posts.length, 3);
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
      expl.post('/api/posts').send(form).end(function (err, res) {
        assert.ifError(err);
        assert2.empty(res.body.err);
        tid = res.body.tid;
        pid = res.body.pid;
        done();
      }
    );
  });
  it('should be true', function (done) {
    expl.get('/api/posts/' + tid, function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.posts[0].editable, true);
      done();
    });
  });
  it('given new user session', function (done) {
    expl.newAgent();
    userf.login('user', done);
  });
  it('should be false', function (done) {
    expl.get('/api/posts/' + tid, function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.posts[0].editable, false);
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('should be true', function (done) {
    expl.get('/api/posts/' + tid, function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.posts[0].editable, true);
      done();
    });
  });
});

describe('redirects', function () {
  it('should success', function (done) {
    expl.get('/post/10').redirects(0).end(function (err, res) {
      assert2.ne(err, undefined);
      assert2.redirect(res, '/posts/10');
      done();
    });
  });
  it('should success', function (done) {
    expl.get('/threads/10').redirects(0).end(function (err, res) {
      assert2.ne(err, undefined); 
      assert2.redirect(res, '/posts/10');
      done();
    });
  });
});
