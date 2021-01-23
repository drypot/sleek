'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const userb = require('../user/user-base');
const userf = require('../user/user-fixture');
const postb = require('../post/post-base');
const postn = require('../post/post-new');
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

describe('creating thread', function () {
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    expl.post('/api/posts', function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should success', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title 1', text: 'post 1' };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      mysql2.queryOne('select * from thread where id = ?', res.body.tid, (err, thread) => {
        assert.ifError(err);
        assert2.e(thread.cid, 100);
        assert2.e(thread.hit, 0);
        assert2.e(thread.length, 1);
        assert2.ne(thread.cdate, undefined);
        assert2.ne(thread.udate, undefined);
        assert2.e(thread.writer, 'snowman');
        assert2.e(thread.title, 'title 1');
        mysql2.queryOne('select * from post where id = ?', res.body.pid, (err, post) => {
          assert.ifError(err);
          postb.unpackPost(post);
          assert2.e(post.tid, res.body.tid);
          assert2.ne(post.cdate, undefined);
          assert2.e(post.visible, true);
          assert2.e(post.writer, 'snowman');
          assert2.e(post.text, 'post 1');
          done();
        });
      });
    });
  });
  it('file should success', function (done) {
    var f1 = 'code/express/express-upload-f1.txt';
    var f2 = 'code/express/express-upload-f2.txt';
    var form = { cid: 100, writer: 'snowman', title: 'title 1', text: 'post 1' };
    expl.post('/api/posts').fields(form).attach('files', f1).attach('files', f2).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      mysql2.queryOne('select * from post where id = ?', res.body.pid, (err, post) => {
        assert.ifError(err);
        postb.unpackPost(post);
        assert2.e(post.files.length, 2);
        assert2.e(post.files[0].name, 'express-upload-f1.txt');
        assert2.e(post.files[1].name, 'express-upload-f2.txt');
        assert2.path('upload/sleek-test/public/post/0/' + post.id + '/express-upload-f1.txt');
        assert2.path('upload/sleek-test/public/post/0/' + post.id + '/express-upload-f2.txt');
        done();
      })
    });
  });
  it('empty title should fail', function (done) {
    var form = { cid: 100, writer: 'snowman', title: ' ', text: 'text' };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'TITLE_EMPTY'));
      done();
    });
  });
  it('logn title should fail', function (done) {
    var bigTitle = 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title';
    var form = { cid: 100, writer: 'snowman', text: 'text', title: bigTitle };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'TITLE_TOO_LONG'));
      done();
    });
  });
  it('empty writer should fail', function (done) {
    var form = { cid: 100, writer: ' ', title: 'title', text: 'text' };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'WRITER_EMPTY'));
      done();
    });
  });
  it('long writer should fail', function (done) {
    var form = { cid: 100, writer: '123456789012345678901234567890123', title: 'title', text: 'text' };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'WRITER_TOO_LONG'));
      done();
    });
  });
  it('invalid category should fail', function (done) {
    var form = { cid: 9999, writer: 'snowman', title: 'title', text: 'text' };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'INVALID_CATEGORY'));
      done();
    });
  });
  it('to recycle bin should fail', function (done) {
    var form = { cid: 40, writer: 'snowman', title: 'title', text: 'text' };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'INVALID_CATEGORY'));
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('to recycle bin should success', function (done) {
    var form = { cid: 40, writer: 'snowman', title: 'title', text: 'text' };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
});

describe('creating replay', function () {
  var tid;
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    expl.post('/api/posts/0', function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given thread', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title 1', text: 'text' };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      tid = res.body.tid;
      done();
    });
  });
  it('should success', function (done) {
    var form = { writer: 'snowman 2', text: 'text 2' };
    expl.post('/api/posts/' + tid).send(form).end(function (err, res) {
      assert2.empty(res.body.err);
      assert2.ne(res.body.pid, undefined);
      mysql2.queryOne('select * from post where id = ?', res.body.pid, (err, post) => {
        assert.ifError(err);
        postb.unpackPost(post);
        assert2.e(post.tid, tid);
        assert2.ne(post.cdate, undefined);
        assert2.e(post.visible, true);
        assert2.e(post.writer, 'snowman 2');
        assert2.e(post.text, 'text 2');
        mysql2.queryOne('select * from thread where id = ?', tid, (err, thread) => {
          assert.ifError(err);
          assert2.e(thread.length, 2);
          assert2.de(thread.udate, post.cdate);
          done();
        });
      });
    });
  });
  it('thread 999 should fail', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    expl.post('/api/posts/999').send(form).end(function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'INVALID_THREAD'));
      done();
    });
  });
  it('thread xxx should fail', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    expl.post('/api/posts/xxx').send(form).end(function (err, res) {
      assert2.ne(err, undefined);
      assert2.e(res.status, 404);
      done();
    });
  });
  it('empty writer should fail', function (done) {
    var form = { writer: ' ', text: 'text' };
    expl.post('/api/posts/' + tid).send(form).end(function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'WRITER_EMPTY'));
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
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      tid = res.body.tid;
      done();
    });
  });
  it('should success', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    expl.post('/api/posts/' + tid).send(form).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should fail', function (done) {
    var form = { writer: 'snowman', text: 'text' };
    expl.post('/api/posts/' + tid).send(form).end(function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'INVALID_CATEGORY'));
      done();
    });
  });
});
