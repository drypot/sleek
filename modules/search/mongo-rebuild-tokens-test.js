var should = require('should');
var request = require('superagent').agent();

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var mongo = require('../mongo/mongo')({ dropDatabase: true });
var exp = require('../main/express');
var post = require('../post/post-base');
var userf = require('../user/user-fixture');

require('../user/user-auth-api');
require('../post/post-api');
require('../search/search-base-api');

before(function (done) {
  init.run(done);
});

before(function () {
  express.listen();
});

var tid1, tid2;
var pid1, pid2, pid3;

describe("posting", function () {
  it("given user session", function (done) {
    userf.login('user', done);
  });
  it("should success for tid1, pid1", function (done) {
    var form = { cid: 101, writer: 'snowman', title: '첫번째 글줄', text: 'apple pine banana' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      tid1 = res.body.tid;
      pid1 = res.body.pid;
      done();
    });
  });
  it("should success for pid2", function (done) {
    var form = { writer: '김순이', text: '둥글게 네모나게 붉게 파랗게' };
    local.post('/api/threads/' + tid1).send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      pid2 = res.body.pid;
      done();
    });
  });
  it("should success for tid2, pid3", function (done) {
    var form = { cid: 101, writer: '박철수', title: '두번째 글줄', text: '붉은 벽돌길을 걷다보면' };
    local.post('/api/threads').send(form).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      tid2 = res.body.tid;
      pid3 = res.body.pid;
      done();
    });
  });
});

describe("searching", function () {
  it("should success for pid1", function (done) {
    local.get('/api/search').query({ q: '첫번째' }).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      var r = res.body.posts;
      r.should.length(1);
      r[0]._id.should.equal(pid1);
      done();
    });
  });
  it("should success for pid2", function (done) {
    local.get('/api/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      var r = res.body.posts;
      r.should.length(1);
      r[0]._id.should.equal(pid2);
      done();
    });
  });
  it("should success for pid3", function (done) {
    local.get('/api/search').query({ q: '박철수' }).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      var r = res.body.posts;
      r.should.length(1);
      r[0]._id.should.equal(pid3);
      done();
    });
  });
});

describe("dropping tokens", function () {
  it("should success", function (done) {
    mongo.posts.update({}, { $unset: { tokens: 1 } }, { multi: true }, done);
  });
});

describe("searching emtpy tokens", function () {
  it("should return nothing for pid1", function (done) {
    local.get('/api/search').query({ q: '첫번째' }).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.posts.should.length(0);
      done();
    });
  });
  it("should return nothing for pid2", function (done) {
    local.get('/api/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      res.body.posts.should.length(0);
      done();
    });
  });
  it("should return nothing for pid3", function (done) {
    local.get('/api/search').query({ q: '박철수' }).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      var r = res.body.posts;
      res.body.posts.should.length(0);
      done();
    });
  });
});

describe("rebuilding", function () {
  it("should success", function (done) {
    post.rebuildTokens(done);
  });
});

describe("re-searching", function () {
  it("should success for pid1", function (done) {
    local.get('/api/search').query({ q: '첫번째' }).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      var r = res.body.posts;
      r.should.length(1);
      r[0]._id.should.equal(pid1);
      done();
    });
  });
  it("should success for pid2", function (done) {
    local.get('/api/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      var r = res.body.posts;
      r.should.length(1);
      r[0]._id.should.equal(pid2);
      done();
    });
  });
  it("should success for pid3", function (done) {
    local.get('/api/search').query({ q: '박철수' }).end(function (err, res) {
      expect(err).not.exist;
      should.not.exist(res.body.err);
      var r = res.body.posts;
      r.should.length(1);
      r[0]._id.should.equal(pid3);
      done();
    });
  });
});