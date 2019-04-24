'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const userf = require('../user/user-fixture');
const postb = require('../post/post-base');
const postn = require('../post/post-new');
const postsr = require('../post/post-search');
const expl = require('../express/express-local');
const assert = require('assert');
const assert2 = require('../base/assert2');

before(function (done) {
  config.path = 'config/test.json';
  mysql2.dropDatabase = true;
  init.run(done);
});

describe.skip('searching', function () {
  var docs = [
    { cid: 100, writer: 'snowman', title: 'title 1', text: 'apple orange banana' },
    { cid: 100, writer: 'snowman', title: 'title 2', text: 'apple orange pine' },
    { cid: 100, writer: 'snowman', title: 'title 3', text: '둥글게 네모나게' },
    { cid: 100, writer: 'santa',   title: 'title 4', text: '둥글게 세모나게' },
    { cid: 300, writer: 'santa',   title: 'title 5', text: '둥글게 동그랗게' },
    { cid: 300, writer: 'rudolph', title: 'title 6', text: 'text 6' },
    { cid: 100, writer: 'rudolph', title: 'title 7', text: 'text 7' },
    { cid:  40, writer: 'admin',   title: 'title 8', text: 'text 8' }
  ];
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('given posts', function (done) {
    var i = 0;
    var len = docs.length;
    (function insert() {
      if (i < len) {
        var doc = docs[i++];
        expl.post('/api/posts').send(doc).end(function (err, res) {
          assert.ifError(err);;
          assert2.empty(res.body.err);
          doc.pid = res.body.pid;
          doc.tid = res.body.tid;
          setImmediate(insert);
        });
        return;
      }
      done();
    })();
  });
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    expl.get('/api/posts/search', function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('should success', function (done) {
    expl.get('/api/posts/search').query({ q: 'text' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(r.length, 3);
      assert2.e(r[0].thread.title, 'title 8');
      assert2.e(r[1].thread.title, 'title 7');
      assert2.e(r[2].thread.title, 'title 6');
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should success', function (done) {
    expl.get('/api/posts/search').query({ q: 'text' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(r.length, 2);
      assert2.e(r[0].thread.title, 'title 7');
      assert2.e(r[1].thread.title, 'title 6');
      done();
    });
  });
  it('user name should success', function (done) {
    expl.get('/api/posts/search').query({ q: 'snowman' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(r.length, 3);
      assert2.e(r[0].thread.title, 'title 3');
      assert2.e(r[1].thread.title, 'title 2');
      assert2.e(r[2].thread.title, 'title 1');
      done();
    });
  });
  it('title should success', function (done) {
    expl.get('/api/posts/search').query({ q: 'title 4' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(r.length, 1);
      assert2.e(r[0].thread.title, 'title 4');
      done();
    });
  });
  it('text should success', function (done) {
    expl.get('/api/posts/search').query({ q: 'apple orange' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(r.length, 2);
      assert2.e(r[0].thread.title, 'title 2');
      assert2.e(r[1].thread.title, 'title 1');
      done();
    });
  });
  it('hangul should success', function (done) {
    expl.get('/api/posts/search').query({ q: '둥글' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(r.length, 3);
      assert2.e(r[0].thread.title, 'title 5');
      assert2.e(r[1].thread.title, 'title 4');
      assert2.e(r[2].thread.title, 'title 3');
      done();
    });
  });
});

describe.skip('rebuilding tokens', function () {
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given posts reset', function (done) {
    postb.threads.deleteMany(function (err) {
      assert.ifError(err);
      postb.posts.deleteMany(function (err) {
        assert.ifError(err);
        done();
      })
    })
  });
  it('given post', function (done) {
    var form = { cid: 100, writer: '이철이', title: '첫번째 글줄', text: '안녕하세요' };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var form = { writer: '김순이', text: '둥글게 네모나게 붉게 파랗게' };
      expl.post('/api/posts/' + res.body.tid).send(form).end(function (err, res) {
        assert.ifError(err);
        assert2.empty(res.body.err);
        done();
      });
    });
  });
  it('given post', function (done) {
    var form = { cid: 100, writer: '박철수', title: '두번째 글줄', text: '붉은 벽돌길을 걷다보면' };
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '첫번째' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(r.length, 1);
      assert2.e(r[0].text, '안녕하세요');
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(r.length, 1);
      assert2.e(r[0].text, '둥글게 네모나게 붉게 파랗게');
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '박철수' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(r.length, 1);
      assert2.e(r[0].text, '붉은 벽돌길을 걷다보면');
      done();
    });
  });
  it('given emtpy tokens', function (done) {
    postb.posts.updateMany({}, { $unset: { tokens: 1 } }, done);
  });
  it('result should be empty', function (done) {
    expl.get('/api/posts/search').query({ q: '첫번째' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.posts.length, 0);
      done();
    });
  });
  it('result should be empty', function (done) {
    expl.get('/api/posts/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.posts.length, 0);
      done();
    });
  });
  it('result should be empty', function (done) {
    expl.get('/api/posts/search').query({ q: '박철수' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(res.body.posts.length, 0);
      done();
    });
  });
  it('given rebuilt tokens', function (done) {
    postsr.rebuildTokens(done);
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '첫번째' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(r.length, 1);
      assert2.e(r[0].text, '안녕하세요');
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(r.length, 1);
      assert2.e(r[0].text, '둥글게 네모나게 붉게 파랗게');
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '박철수' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.posts;
      assert2.e(r.length, 1);
      assert2.e(r[0].text, '붉은 벽돌길을 걷다보면');
      done();
    });
  });
});
