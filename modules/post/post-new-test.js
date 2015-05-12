var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongop = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var postb = require('../post/post-base');
var postn = require('../post/post-new');
var local = require('../express/local');
var expect = require('../base/assert').expect;

before(function (done) {
  init.run(done);
});

describe('creating thread', function () {
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.post('/api/posts', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should success', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title 1', text: 'post 1' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      postb.threads.findOne({ _id: res.body.tid }, function (err, thread) {
        expect(err).not.exist;
        expect(thread.cid).equals(100);
        expect(thread.hit).equals(0);
        expect(thread.length).equals(1);
        expect(thread.cdate).exist;
        expect(thread.udate).exist;
        expect(thread.writer).equals('snowman');
        expect(thread.title).equals('title 1');
        postb.posts.findOne({ _id: res.body.pid }, function (err, post) {
          expect(err).not.exist;
          expect(post.tid).equals(res.body.tid);
          expect(post.cdate).exist;
          expect(post.visible).true;
          expect(post.writer).equals('snowman');
          expect(post.text).equals('post 1');
          expect(post.tokens).exist;
          done();
        });
      });
    });
  });
  it('file should success', function (done) {
    var f1 = 'modules/express/upload-fixture1.txt';
    var f2 = 'modules/express/upload-fixture2.txt';
    var form = { cid: 100, writer: 'snowman', title: 'title 1', text: 'post 1' };
    local.post('/api/posts').fields(form).attach('files', f1).attach('files', f2).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      postb.posts.findOne({ _id: res.body.pid }, function (err, post) {
        expect(err).not.exist;
        expect(post.files).length(2);
        expect(post.files[0].name).equal('upload-fixture1.txt');
        expect(post.files[1].name).equal('upload-fixture2.txt');
        expect('upload/sleek-test/public/post/0/' + post._id + '/upload-fixture1.txt').pathExist;
        expect('upload/sleek-test/public/post/0/' + post._id + '/upload-fixture2.txt').pathExist;
        done();
      })
    });
  });
  it('empty title should fail', function (done) {
    var form = { cid: 100, writer: 'snowman', title: ' ', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('TITLE_EMPTY');
      done();
    });
  });
  it('logn title should fail', function (done) {
    var bigTitle = 'big title title title title title title title title title title title title title title title title title title title title title title title title title title title title';
    var form = { cid: 100, writer: 'snowman', text: 'text', title: bigTitle };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('TITLE_TOO_LONG');
      done();
    });
  });
  it('empty writer should fail', function (done) {
    var form = { cid: 100, writer: ' ', title: 'title', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('WRITER_EMPTY');
      done();
    });
  });
  it('long writer should fail', function (done) {
    var form = { cid: 100, writer: '123456789012345678901234567890123', title: 'title', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('WRITER_TOO_LONG');
      done();
    });
  });
  it('invalid category should fail', function (done) {
    var form = { cid: 9999, writer: 'snowman', title: 'title', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('INVALID_CATEGORY');
      done();
    });
  });
  it('to recycle bin should fail', function (done) {
    var form = { cid: 40, writer: 'snowman', title: 'title', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('INVALID_CATEGORY');
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('to recycle bin should success', function (done) {
    var form = { cid: 40, writer: 'snowman', title: 'title', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
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
        postb.threads.findOne({ _id: tid }, function (err, thread) {
          expect(err).not.exist;
          expect(thread.length).equal(2);
          expect(thread.udate).eql(post.cdate);
          done();
        });
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
