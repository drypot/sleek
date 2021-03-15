import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as error from '../base/error.js';
import * as config from '../base/config.js';
import * as db from '../db/db.js';
import * as expb from '../express/express-base.js';
import * as expl from "../express/express-local.js";
import * as userf from "../user/user-fixture.js";
import * as postb from "./post-base.js";
import * as postn from "./post-new.js";
import * as postsr from "./post-search.js";

before(function (done) {
  config.setPath('config/test.json');
  db.setDropDatabase(true);
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
    const form = {cid: 100, writer: '이철이', title: '첫번째 글줄', text: '안녕하세요'};
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      const form = {writer: '김순이', text: '둥글게 네모나게 붉게 파랗게'};
      expl.post('/api/posts/' + res.body.tid).send(form).end(function (err, res) {
        assert2.ifError(err);
        assert2.empty(res.body.err);
        done();
      });
    });
  });
  it('given post', function (done) {
    const form = {cid: 100, writer: '박철수', title: '두번째 글줄', text: '붉은 벽돌길을 걷다보면'};
    expl.post('/api/posts').send(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '첫번째' }).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      const r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, '첫번째 글줄');
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      const r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, '첫번째 글줄');
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '박철수' }).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      const r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, '두번째 글줄');
      done();
    });
  });
  it('given emtpy tokens', function (done) {
    db.query('truncate table threadmerged', done);
  });
  it('result should be empty', function (done) {
    expl.get('/api/posts/search').query({ q: '첫번째' }).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.threads.length, 0);
      done();
    });
  });
  it('result should be empty', function (done) {
    expl.get('/api/posts/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.threads.length, 0);
      done();
    });
  });
  it('result should be empty', function (done) {
    expl.get('/api/posts/search').query({ q: '박철수' }).end(function (err, res) {
      assert2.ifError(err);
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
      assert2.ifError(err);
      assert2.empty(res.body.err);
      const r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, '첫번째 글줄');
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '둥글게 네모나게' }).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      const r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, '첫번째 글줄');
      done();
    });
  });
  it('search should success', function (done) {
    expl.get('/api/posts/search').query({ q: '박철수' }).end(function (err, res) {
      assert2.ifError(err);
      assert2.empty(res.body.err);
      const r = res.body.threads;
      assert2.e(r.length, 1);
      assert2.e(r[0].title, '두번째 글줄');
      done();
    });
  });
});
