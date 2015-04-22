var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongop = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var postb = require('../post/post-base');
var postu = require('../post/post-update');
var local = require('../express/local');
var expect = require('../base/assert').expect

before(function (done) {
  init.run(done);
});

describe('updating', function () {
  var tid, pid, pid2, pid3;
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.put('/api/posts/0/0', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given thread and posts', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title', text: 'text' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      tid = res.body.tid;
      pid = res.body.pid;
      done();
    });
  });
  it('updating head should success', function (done) {
    var form = { cid: 100, writer: 'snowman2', title: 'title2', text: 'text2' };
    local.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      postb.threads.findOne({ _id: tid}, function (err, thread) {
        expect(err).not.exist;
        expect(thread.cid).equals(100);
        expect(thread.hit).equals(0);
        expect(thread.length).equals(1);
        expect(thread.cdate).exist;
        expect(thread.udate).exist;
        expect(thread.writer).equals('snowman2');
        expect(thread.title).equals('title2');
        postb.posts.findOne({ _id: pid }, function (err, post) {
          expect(err).not.exist;
          expect(post.tid).equals(tid);
          expect(post.cdate).exist;
          expect(post.visible).true;
          expect(post.writer).equals('snowman2');
          expect(post.text).equals('text2');
          expect(post.tokens).exist;
          done();
        });
      });
    });
  });
  it('given reply', function (done) {
    var form = { writer: 'snowman', text: 'text2' };
    local.post('/api/posts/' + tid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      pid2 = res.body.pid;
      done();
    });
  });
  it('updating reply should success', function (done) {
    var form = { writer: 'snowman3', text: 'text3' };
    local.put('/api/posts/' + tid + '/' + pid2).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      postb.threads.findOne({ _id: tid}, function (err, thread) {
        expect(err).not.exist;
        expect(thread.cid).equals(100);
        expect(thread.hit).equals(0);
        expect(thread.length).equals(1);
        expect(thread.cdate).exist;
        expect(thread.udate).exist;
        expect(thread.writer).equals('snowman2');
        expect(thread.title).equals('title2');
        postb.posts.findOne({ _id: pid2 }, function (err, post) {
          expect(err).not.exist;
          expect(post.tid).equals(tid);
          expect(post.cdate).exist;
          expect(post.visible).true;
          expect(post.writer).equals('snowman3');
          expect(post.text).equals('text3');
          expect(post.tokens).exist;
          done();
        });
      });
    });
  });
  it('given files', function (done) {
    var f1 = 'modules/express/upload-fixture1.txt';
    var f2 = 'modules/express/upload-fixture2.txt';
    var f3 = 'modules/express/upload-fixture3.txt';
    var form = { writer: 'snowman', text: 'post with files' };
    local.post('/api/posts/' + tid).fields(form)
      .attach('files', f1).attach('files', f2).attach('files', f3).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      pid3 = res.body.pid;
      done();
    });
  });
  it('updating files should success', function (done) {
    var f3 = 'modules/express/upload-fixture3.txt';
    var f4 = 'modules/express/upload-fixture4.txt';
    var form = { writer: 'snowman', text: 'post with files', dfiles: ['nofile.txt', 'upload-fixture2.txt'] };
    local.put('/api/posts/' + tid + '/' + pid3).fields(form)
      .attach('files', f3).attach('files', f4).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      postb.posts.findOne({ _id: pid3 }, function (err, post) {
        expect(err).not.exist;
        expect(post.files).eql([
          { name : 'upload-fixture1.txt'}, 
          { name : 'upload-fixture3.txt'}, 
          { name : 'upload-fixture4.txt'}
        ]);
        expect('upload/sleek-test/public/post/0/' + pid3 + '/upload-fixture1.txt').pathExist;
        expect('upload/sleek-test/public/post/0/' + pid3 + '/upload-fixture2.txt').not.pathExist;
        expect('upload/sleek-test/public/post/0/' + pid3 + '/upload-fixture3.txt').pathExist;
        expect('upload/sleek-test/public/post/0/' + pid3 + '/upload-fixture4.txt').pathExist;
        done();
      });
    });    
  });
  it('deleting one file should success', function (done) {
    var form = { writer: 'snowman', text: 'post with files', dfiles: 'upload-fixture3.txt' };
    local.put('/api/posts/' + tid + '/' + pid3).fields(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      postb.posts.findOne({ _id: pid3 }, function (err, post) {
        expect(err).not.exist;
        expect(post.files).eql([
          { name : 'upload-fixture1.txt'}, 
          { name : 'upload-fixture4.txt'}
        ]);
        expect('upload/sleek-test/public/post/0/' + pid3 + '/upload-fixture1.txt').pathExist;
        expect('upload/sleek-test/public/post/0/' + pid3 + '/upload-fixture3.txt').not.pathExist;
        expect('upload/sleek-test/public/post/0/' + pid3 + '/upload-fixture4.txt').pathExist;
        done();
      });
    });    
  });
  it('updating category should success', function (done) {
    var form = { cid: 102, writer: 'snowman', title: 'title', text: 'text' };
    local.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      postb.threads.findOne({ _id: tid}, function (err, thread) {
        expect(err).not.exist;
        expect(thread.cid).equals(102);
        done();
      });
    });
  });
  it('emtpy title should fail', function (done) {
    var form = { cid: 100, writer: 'snowman', title: ' ', text: 'text'};
    local.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('TITLE_EMPTY');
      done();
    });
  });
  it('emtpy writer should fail', function (done) {
    var form = { cid: 100, writer: ' ', title: 'title', text: 'text'};
    local.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('WRITER_EMPTY');
      done();
    });
  });
  it('user can not change visible', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title', text: 'text', visible: false };
    local.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      postb.posts.findOne({ _id: pid}, function (err, post) {
        expect(err).not.exist;
        expect(post.visible).true;
        done();
      });
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('admin can change visible', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title', text: 'text', visible: false };
    local.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      postb.posts.findOne({ _id: pid}, function (err, post) {
        expect(err).not.exist;
        expect(post.visible).false;
        done();
      });
    });
  });
  it('given new session', function (done) {
    local.newAgent();
    userf.login('user', done);
  });
  it('should fail', function (done) {
    var form = { cid: 100, writer: 'snowman', title: 'title', text: 'text' };
    local.put('/api/posts/' + tid + '/' + pid).send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHORIZED');
      done();
    });
  });
});
