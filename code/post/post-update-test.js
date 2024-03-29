import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as error from '../base/error.js';
import * as config from '../base/config.js';
import * as db from '../db/db.js';
import * as expb from '../express/express-base.js';
import * as expl from "../express/express-local.js";
import * as userb from "../user/user-base.js";
import * as userf from "../user/user-fixture.js";
import * as postb from "../post/post-base.js";
import * as postu from "../post/post-update.js";

before(function (done) {
  config.setPath('config/test.json');
  db.setDropDatabase(true);
  init.run(done);
});

before((done) => {
  expb.start();
  done();
});

describe('updating', function () {
  var tid, pid, pid2, pid3;
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    expl.put('/api/posts/0/0', function (err, res) {
      assert2.ifError(err);
      assert2.ok(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given thread and posts', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title', text: 'text' };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      tid = res.body.tid;
      pid = res.body.pid;
      done();
    });
  });
  it('updating head should success', function (done) {
    var form = { cid: 100, writer: 'snowman2', title: 'title2', text: 'text2' };
    expl.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      db.queryOne('select * from thread where id = ?', tid, (err, thread) => {
        assert2.ifError(err);
        assert2.e(thread.cid, 100);
        assert2.e(thread.hit, 0);
        assert2.e(thread.length, 1);
        assert2.ne(thread.cdate, undefined);
        assert2.ne(thread.udate, undefined);
        assert2.e(thread.writer, 'snowman2');
        assert2.e(thread.title, 'title2');
        db.queryOne('select * from post where id = ?', pid, (err, post) => {
          assert2.ifError(err);
          postb.unpackPost(post);
          assert2.e(post.tid, tid);
          assert2.ne(post.cdate, undefined);
          assert2.e(post.visible, true);
          assert2.e(post.writer, 'snowman2');
          assert2.e(post.text, 'text2');
          done();
        });
      });
    });
  });
  it('given reply', function (done) {
    var form = { writer: 'snowman', text: 'text2' };
    expl.post('/api/posts/' + tid).send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      pid2 = res.body.pid;
      done();
    });
  });
  it('updating reply should success', function (done) {
    var form = { writer: 'snowman3', text: 'text3' };
    expl.put('/api/posts/' + tid + '/' + pid2).send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      db.queryOne('select * from thread where id = ?', tid, (err, thread) => {
        assert2.ifError(err);
        assert2.e(thread.cid, 100);
        assert2.e(thread.hit, 0);
        assert2.e(thread.length, 2);
        assert2.ne(thread.cdate, undefined);
        assert2.ne(thread.udate, undefined);
        assert2.e(thread.writer, 'snowman2');
        assert2.e(thread.title, 'title2');
        db.queryOne('select * from post where id = ?', pid2, (err, post) => {
          assert2.ifError(err);
          postb.unpackPost(post);
          assert2.e(post.tid, tid);
          assert2.ne(post.cdate, undefined);
          assert2.e(post.visible, true);
          assert2.e(post.writer, 'snowman3');
          assert2.e(post.text, 'text3');
          done();
        });
      });
    });
  });
  it('given files', function (done) {
    var f1 = 'code/express/express-upload-f1.txt';
    var f2 = 'code/express/express-upload-f2.txt';
    var f3 = 'code/express/express-upload-f3.txt';
    var form = { writer: 'snowman', text: 'post with files' };
    expl.post('/api/posts/' + tid).fields(form)
      .attach('files', f1).attach('files', f2).attach('files', f3).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      pid3 = res.body.pid;
      done();
    });
  });
  it('updating files should success', function (done) {
    var f3 = 'code/express/express-upload-f3.txt';
    var f4 = 'code/express/express-upload-f4.txt';
    var form = { writer: 'snowman', text: 'post with files', dfiles: ['nofile.txt', 'express-upload-f2.txt'] };
    expl.put('/api/posts/' + tid + '/' + pid3).fields(form)
      .attach('files', f3).attach('files', f4).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      db.queryOne('select * from post where id = ?', pid3, (err, post) => {
        assert2.ifError(err);
        postb.unpackPost(post);
        assert2.de(post.files, [
          { name : 'express-upload-f1.txt'},
          { name : 'express-upload-f3.txt'},
          { name : 'express-upload-f4.txt'}
        ]);
        assert2.path('upload/sleek-test/public/post/0/' + pid3 + '/express-upload-f1.txt');
        assert2.path('upload/sleek-test/public/post/0/' + pid3 + '/express-upload-f2.txt', false);
        assert2.path('upload/sleek-test/public/post/0/' + pid3 + '/express-upload-f3.txt');
        assert2.path('upload/sleek-test/public/post/0/' + pid3 + '/express-upload-f4.txt');
        done();
      });
    });
  });
  it('deleting one file should success', function (done) {
    var form = { writer: 'snowman', text: 'post with files', dfiles: 'express-upload-f3.txt' };
    expl.put('/api/posts/' + tid + '/' + pid3).fields(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      db.queryOne('select * from post where id = ?', pid3, (err, post) => {
        assert2.ifError(err);
        postb.unpackPost(post);
        assert2.de(post.files, [
          { name : 'express-upload-f1.txt'},
          { name : 'express-upload-f4.txt'}
        ]);
        assert2.path('upload/sleek-test/public/post/0/' + pid3 + '/express-upload-f1.txt');
        assert2.path('upload/sleek-test/public/post/0/' + pid3 + '/express-upload-f3.txt', false);
        assert2.path('upload/sleek-test/public/post/0/' + pid3 + '/express-upload-f4.txt');
        done();
      });
    });
  });
  it('updating category should success', function (done) {
    var form = { cid: 102, writer: 'snowman', title: 'title', text: 'text' };
    expl.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      db.queryOne('select * from thread where id = ?', tid, (err, thread) => {
        assert2.ifError(err);
        assert2.e(thread.cid, 102);
        done();
      });
    });
  });
  it('emtpy title should fail', function (done) {
    var form = { cid: 100, writer: 'snowman', title: ' ', text: 'text'};
    expl.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.ok(error.find(res.body.err, 'TITLE_EMPTY'));
      done();
    });
  });
  it('emtpy writer should fail', function (done) {
    var form = { cid: 100, writer: ' ', title: 'title', text: 'text'};
    expl.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.ok(error.find(res.body.err, 'WRITER_EMPTY'));
      done();
    });
  });
  it('user can not change visible', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title', text: 'text', visible: false };
    expl.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      db.queryOne('select * from post where id = ?', pid, (err, post) => {
        assert2.ifError(err);
        postb.unpackPost(post);
        assert2.e(post.visible, true);
        done();
      });
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('admin can change visible', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title', text: 'text', visible: false };
    expl.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      db.queryOne('select * from post where id = ?', pid, (err, post) => {
        assert2.ifError(err);
        postb.unpackPost(post);
        assert2.e(post.visible, false);
        done();
      });
    });
  });
  it('given new session', function (done) {
    expl.newAgent();
    userf.login('user', done);
  });
  it('should fail', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title', text: 'text' };
    expl.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.ok(error.find(res.body.err, 'NOT_AUTHORIZED'));
      done();
    });
  });
});
