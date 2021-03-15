import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as error from '../base/error.js';
import * as config from '../base/config.js';
import * as db from '../db/db.js';
import * as expb from '../express/express-base.js';
import * as expl from "../express/express-local.js";
import * as userf from "../user/user-fixture.js";
import * as postn from "../post/post-new.js";
import * as postv from "../post/post-view.js";

before(function (done) {
  config.setPath('config/test.json');
  db.setDropDatabase(true);
  init.run(done);
});

before((done) => {
  expb.start();
  done();
});

describe('thread and posts', function () {
  let tid;
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given thread', function (done) {
    const form = {cid: 100, writer: 'snowman', title: 'title', text: 'post1'};
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      tid = res.body.tid;
      done();
    });
  });
  it('given reply', function (done) {
    const form = {writer: 'snowman2', text: 'post2'};
    expl.post('/api/posts/' + tid).send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('given invisible reply', function (done) {
    const form = {writer: 'admin', text: 'post3', visible: false};
    expl.post('/api/posts/' + tid).send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    expl.get('/api/posts/0', function (err, res) {
      assert2.ifError(err);
      assert2.ok(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should return 2 posts', function (done) {
    expl.get('/api/posts/' + tid, function (err, res) {
      assert2.ifError(err);
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
      assert2.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.posts.length, 3);
      done();
    });
  });
});

describe('post editable', function () {
  let tid, pid;
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given thread', function (done) {
    const form = {cid: 100, writer: 'snowman', title: 'title 1', text: 'post 1'};
    expl.post('/api/posts').send(form).end(function (err, res) {
        assert2.ifError(err);
        assert2.empty(res.body.err);
        tid = res.body.tid;
        pid = res.body.pid;
        done();
      }
    );
  });
  it('should be true', function (done) {
    expl.get('/api/posts/' + tid, function (err, res) {
      assert2.ifError(err);
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
      assert2.ifError(err);
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
      assert2.ifError(err);
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
