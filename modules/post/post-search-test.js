var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongop = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../express/express');
var userf = require('../user/user-fixture');
var postb = require('../post/post-base');
var postn = require('../post/post-new');
var postsr = require('../post/post-search');
var local = require('../express/local');
var expect = require('../base/assert').expect;

before(function (done) {
  init.run(done);
});

describe('searching', function () {
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
        local.post('/api/posts').send(doc).end(function (err, res) {
          expect(err).not.exist;;
          expect(res.body.err).not.exist;
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
    local.get('/api/posts/search', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('should success', function (done) {
    local.get('/api/posts/search').query({ q: 'text' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(r).length(3);
      expect(r[0].thread.title).equal('title 8');
      expect(r[1].thread.title).equal('title 7');
      expect(r[2].thread.title).equal('title 6');
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should success', function (done) {
    local.get('/api/posts/search').query({ q: 'text' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(r).length(2);
      expect(r[0].thread.title).equal('title 7');
      expect(r[1].thread.title).equal('title 6');
      done();
    });
  });
  it('user name should success', function (done) {
    local.get('/api/posts/search').query({ q: 'snowman' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(r).length(3);
      expect(r[0].thread.title).equal('title 3');
      expect(r[1].thread.title).equal('title 2');
      expect(r[2].thread.title).equal('title 1');
      done();
    });
  });
  it('title should success', function (done) {
    local.get('/api/posts/search').query({ q: 'title 4' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(r).length(1);
      expect(r[0].thread.title).equal('title 4');
      done();
    });
  });
  it('text should success', function (done) {
    local.get('/api/posts/search').query({ q: 'apple orange' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(r).length(2);
      expect(r[0].thread.title).equal('title 2');
      expect(r[1].thread.title).equal('title 1');
      done();
    });
  });
  it('hangul should success', function (done) {
    local.get('/api/posts/search').query({ q: '둥글' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(r).length(3);
      expect(r[0].thread.title).equal('title 5');
      expect(r[1].thread.title).equal('title 4');
      expect(r[2].thread.title).equal('title 3');
      done();
    });
  });
});

describe('rebuilding tokens', function () {
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('given posts reset', function (done) {
    postb.threads.deleteMany(function (err) {
      expect(err).not.exist;
      postb.posts.deleteMany(function (err) {
        expect(err).not.exist;
        done();
      })
    })
  });
  it('given post', function (done) {
    var form = { cid: 100, writer: '이철이', title: '첫번째 글줄', text: '안녕하세요' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var form = { writer: '김순이', text: '둥글게 네모나게 붉게 파랗게' };
      local.post('/api/posts/' + res.body.tid).send(form).end(function (err, res) {
        expect(err).not.exist;
        expect(res.body.err).not.exist;
        done();
      });
    });
  });
  it('given post', function (done) {
    var form = { cid: 100, writer: '박철수', title: '두번째 글줄', text: '붉은 벽돌길을 걷다보면' };
    local.post('/api/posts').send(form).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('search should success', function (done) {
    local.get('/api/posts/search').query({ q: '첫번째' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(r).length(1);
      expect(r[0].text).equal('안녕하세요');
      done();
    });
  });
  it('search should success', function (done) {
    local.get('/api/posts/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(r).length(1);
      expect(r[0].text).equal('둥글게 네모나게 붉게 파랗게');
      done();
    });
  });
  it('search should success', function (done) {
    local.get('/api/posts/search').query({ q: '박철수' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(r).length(1);
      expect(r[0].text).equal('붉은 벽돌길을 걷다보면');
      done();
    });
  });
  it('given emtpy tokens', function (done) {
    postb.posts.updateMany({}, { $unset: { tokens: 1 } }, done);
  });
  it('result should be empty', function (done) {
    local.get('/api/posts/search').query({ q: '첫번째' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.posts).length(0);
      done();
    });
  });
  it('result should be empty', function (done) {
    local.get('/api/posts/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.posts).length(0);
      done();
    });
  });
  it('result should be empty', function (done) {
    local.get('/api/posts/search').query({ q: '박철수' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(res.body.posts).length(0);
      done();
    });
  });
  it('given rebuilt tokens', function (done) {
    postsr.rebuildTokens(done);
  });
  it('search should success', function (done) {
    local.get('/api/posts/search').query({ q: '첫번째' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(r).length(1);
      expect(r[0].text).equal('안녕하세요');
      done();
    });
  });
  it('search should success', function (done) {
    local.get('/api/posts/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(r).length(1);
      expect(r[0].text).equal('둥글게 네모나게 붉게 파랗게');
      done();
    });
  });
  it('search should success', function (done) {
    local.get('/api/posts/search').query({ q: '박철수' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      var r = res.body.posts;
      expect(r).length(1);
      expect(r[0].text).equal('붉은 벽돌길을 걷다보면');
      done();
    });
  });
});