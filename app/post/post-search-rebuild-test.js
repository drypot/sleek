'use strict';

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const mysql2 = require('../mysql/mysql2');
const expb = require('../express/express-base');
const userf = require('../user/user-fixture');
const postb = require('./post-base');
const postn = require('./post-new');
const postsr = require('./post-search');
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

describe('rebuilding tokens', function () {
  it('given user', function (done) {
    userf.login('user', done);
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
      var r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, '첫번째 글줄');
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, '첫번째 글줄');
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '박철수' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, '두번째 글줄');
      done();
    });
  });
  it('given emtpy tokens', function (done) {
    mysql2.query('truncate table threadmerged', done);
  });
  it('result should be empty', function (done) {
    expl.get('/api/posts/search').query({ q: '첫번째' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.threads.length, 0);
      done();
    });
  });
  it('result should be empty', function (done) {
    expl.get('/api/posts/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.threads.length, 0);
      done();
    });
  });
  it('result should be empty', function (done) {
    expl.get('/api/posts/search').query({ q: '박철수' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.threads.length, 0);
      done();
    });
  });
  it('given rebuilt tokens', function (done) {
    postsr.updateAll(done);
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '첫번째' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, '첫번째 글줄');
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, '첫번째 글줄');
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '박철수' }).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      var r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, '두번째 글줄');
      done();
    });
  });
});
