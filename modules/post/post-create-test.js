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

describe.only('creating thread', function () {
  it('given user login', function (done) {
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
        })
      });
    });
  });
  it('file should success', function (done) {
    var f1 = 'modules/express/upload-fixture1.txt';
    var form = { cid: 100, writer: 'snowman', title: 'title 1', text: 'post 1' };
    local.post('/api/posts').fields(form).attach('files', f1).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      postb.posts.findOne({ _id: res.body.pid }, function (err, post) {
        expect(err).not.exist;
        expect(post.files).length(1);
        expect(post.files[0].name).equal('upload-fixture1.txt');
        expect('upload/sleek-test/public/post/0/' + post._id + '/upload-fixture1.txt').pathExist;
        done();
      })
    });
  });
  it('should fail when title empty', function (done) {
    var form = { cid: 100, writer: 'snowman', title: ' ', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('FILL_TITLE');
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
  it('should fail when writer empty', function (done) {
    var form = { cid: 100, writer: ' ', title: 'title', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('FILL_WRITER');
      done();
    });
  });
  it('should fail when writer big', function (done) {
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
  it('given admin session', function (done) {
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
  it('given logged out', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.post('/api/posts', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
});
