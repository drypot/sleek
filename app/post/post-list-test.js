'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const userb = require('../user/user-base');
const userf = require('../user/user-fixture');
const postn = require('../post/post-new');
const postl = require('../post/post-list');
const expl = require('../express/express-local');
const assert = require('assert');
const assert2 = require('../base/assert2');

before(function (done) {
  init.run(done);
});

describe('preparing sample docs', function () {
  var samples = [
    { cid: 40,  writer: 'snowman', title: 'rbin 1', text: 'text' },
    { cid: 100, writer: 'snowman', title: 'freetalk 1', text: 'text' },
    { cid: 100, writer: 'snowman', title: 'freetalk 2', text: 'text' },
    { cid: 100, writer: 'snowman', title: 'freetalk 3', text: 'text' },
    { cid: 100, writer: 'snowman', title: 'freetalk 4', text: 'text' },
    { cid: 120, writer: 'snowman', title: 'game 1', text: 'text' },
    { cid: 120, writer: 'snowman', title: 'game 2', text: 'text' },
    { cid: 120, writer: 'snowman', title: 'game 3', text: 'text' },
    { cid: 120, writer: 'snowman', title: 'game 4', text: 'text' }
  ];
  it('given admin', function (done) {
    userf.login('admin', done)
  });
  it('should success', function (done) {
    var i = 0;
    (function insert() {
      if (i < samples.length) {
        expl.post('/api/posts').send(samples[i++]).end(function (err, res) {
          assert.ifError(err);
          assert2.empty(res.body.err);
          setImmediate(insert);
        });
        return;
      }
      done();
    })();
  });
});

describe('checking user', function () {
  it('given no login', function (done) {
    userf.logout(done);
  });
  it('api should fail', function (done) {
    expl.get('/api/posts', function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
  it('/ should redirected', function (done) {
    expl.get('/').redirects(0).end(function (err, res) {
      assert2.ne(err, undefined); 
      assert2.redirect(res, '/posts');
      done();
    });
  });
  it('/posts should redirected', function (done) {
    expl.get('/posts').redirects(0).end(function (err, res) {
      assert2.ne(err, undefined); 
      assert2.redirect(res, '/users/login');
      done();
    });
  });
  it('given login', function (done) {
    userf.login('user', done);
  });
  it('api should success', function (done) {
    expl.get('/api/posts', function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
  it('/ should redirected', function (done) {
    expl.get('/').redirects(0).end(function (err, res) {
      assert2.ne(err, undefined); 
      assert2.redirect(res, '/posts');
      done();
    });
  });
  it('/posts should success', function (done) {
    expl.get('/posts').redirects(0).end(function (err, res) {
      assert.ifError(err);
      assert(res.text.indexOf('<title>all') > 0);
      done();
    });
  });
});

describe('listing threads', function () {
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('category 0 should success', function (done) {
    expl.get('/api/posts', function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var threads = res.body.threads;
      assert2.e(threads.length, 9)
      assert2.e(threads[0].title, 'game 4');
      assert2.e(threads[1].title, 'game 3');
      assert2.e(threads[2].title, 'game 2');
      assert2.e(threads[3].title, 'game 1');
      assert2.e(threads[4].title, 'freetalk 4');
      assert2.e(threads[5].title, 'freetalk 3');
      assert2.e(threads[6].title, 'freetalk 2');
      assert2.e(threads[7].title, 'freetalk 1');
      assert2.e(threads[8].title, 'rbin 1');
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('category 0 should success', function (done) {
    expl.get('/api/posts', function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var threads = res.body.threads;
      assert2.e(threads.length, 8)
      assert2.e(threads[0].title, 'game 4');
      assert2.e(threads[1].title, 'game 3');
      assert2.e(threads[2].title, 'game 2');
      assert2.e(threads[3].title, 'game 1');
      assert2.e(threads[4].title, 'freetalk 4');
      assert2.e(threads[5].title, 'freetalk 3');
      assert2.e(threads[6].title, 'freetalk 2');
      assert2.e(threads[7].title, 'freetalk 1');
      assert2.e(threads[8], undefined); // should not be rbin 6
      done();
    });
  });
  it('category 0 page 2 should success', function (done) {
    expl.get('/api/posts').query({ c: 0, pg: 2, ps: 3 }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var threads = res.body.threads;
      assert2.e(threads.length, 3);
      assert2.e(threads[0].title, 'game 1');
      assert2.e(threads[1].title, 'freetalk 4');
      assert2.e(threads[2].title, 'freetalk 3');
      done();
    });
  });
  it('category 100 should success', function (done) {
    expl.get('/api/posts').query({ c: 100 }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var threads = res.body.threads;
      assert2.e(threads.length, 4);
      assert2.e(threads[0].title, 'freetalk 4');
      done();
    });
  });
  it('category 40 should fail', function (done) {
    expl.get('/api/posts').query({ c: 40 }).end(function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'INVALID_CATEGORY'));
      done();
    });
  });
  it('category 0 should have category field', function (done) {
    expl.get('/api/posts').query({ c: 0, ps: 1 }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var threads = res.body.threads;
      assert2.ne(threads[0].id, undefined);
      assert2.e(threads[0].writer, 'snowman');
      assert2.e(threads[0].title, 'game 4');
      assert2.e(threads[0].hit, 0);
      assert2.e(threads[0].length, 1);
      assert2.e(threads[0].category.id, 120);
      assert2.e(threads[0].category.name, 'game');
      done();
    });
  });
  it('category 100 should have no category field', function (done) {
    expl.get('/api/posts').query({ c: 100, ps: 1 }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var threads = res.body.threads;
      assert2.ne(threads[0].id, undefined);
      assert2.e(threads[0].writer, 'snowman');
      assert2.e(threads[0].title, 'freetalk 4');
      assert2.e(threads[0].hit, 0);
      assert2.e(threads[0].length, 1);
      assert2.e(threads[0].category, undefined);
      done();
    });
  });
  it('page 1 is not last', function (done) {
    expl.get('/api/posts').query({ c: 0, pg: 1, ps: 4 }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.last, false);
      done();
    });
  });
  it('page 2 is not last', function (done) {
    expl.get('/api/posts').query({ c: 0, pg: 2, ps: 4 }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.last, false);
      done();
    });
  });
  it('page 3 is last', function (done) {
    expl.get('/api/posts').query({ c: 0, pg: 3, ps: 4 }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.last, true);
      done();
    });
  });
});

describe('redirects', function () {
  it('should success', function (done) {
    expl.get('/threads').redirects(0).end(function (err, res) {
      assert2.ne(err, undefined); 
      assert2.redirect(res, '/posts');
      done();
    });
  });
});
